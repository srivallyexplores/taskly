import { SendEmailCommand } from '@aws-sdk/client-ses';
import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { SQSClient } from '@aws-sdk/client-sqs';
import { sesClient, awsRegion } from '../config/aws.js';
import {
  welcomeEmail,
  teamInviteEmail,
  passwordResetEmail,
  taskAssignedEmail,
} from '../utils/emailTemplates.js';

/**
 * Email Service — AWS SES integration with SQS buffering.
 *
 * Migrates email sending from Nodemailer/Resend to AWS SES.
 * Emails can be sent directly (for time-sensitive messages like password resets)
 * or queued via SQS for buffered delivery (invitations, notifications).
 *
 * Features:
 * - Direct SES sending for immediate delivery
 * - SQS queue integration for buffered/batched email delivery
 * - Retry logic with exponential backoff (3 attempts)
 * - Template rendering using existing Taskly email templates
 *
 * 
 * - 6.1: Deliver email within 5 seconds of request
 * - 6.3: Retry with exponential backoff up to 3 attempts on failure
 * - 6.4: Support all existing email templates
 * - 6.5: Buffer emails via SQS when rate limit is reached
 */

// SQS client for email queue operations
const sqsClient = new SQSClient({ region: awsRegion });

// Configuration
const DEFAULT_SENDER = process.env.SES_SENDER_EMAIL || 'noreply@taskly.app';
const EMAIL_QUEUE_URL = process.env.EMAIL_QUEUE_URL || '';
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000; // 1 second base delay for exponential backoff

/**
 * Sends an email directly via SES with retry logic.
 *
 * @param {object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject line
 * @param {string} options.html - HTML body content
 * @param {string} [options.from] - Sender email (defaults to configured sender)
 * @param {string} [options.replyTo] - Reply-to address
 * @returns {Promise<object>} SES send result with messageId
 * @throws {Error} After all retry attempts are exhausted
 */
export async function sendEmail({ to, subject, html, from, replyTo }) {
  const params = {
    Source: from || DEFAULT_SENDER,
    Destination: {
      ToAddresses: Array.isArray(to) ? to : [to],
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: 'UTF-8',
      },
      Body: {
        Html: {
          Data: html,
          Charset: 'UTF-8',
        },
      },
    },
  };

  if (replyTo) {
    params.ReplyToAddresses = Array.isArray(replyTo) ? replyTo : [replyTo];
  }

  return await sendWithRetry(params);
}

/**
 * Queues an email for asynchronous delivery via SQS.
 * Use this for non-urgent emails (invitations, digests) to buffer
 * against SES rate limits and decouple sending from the request path.
 *
 * @param {object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject line
 * @param {string} options.html - HTML body content
 * @param {string} [options.from] - Sender email
 * @param {string} [options.replyTo] - Reply-to address
 * @param {number} [options.delaySeconds] - SQS delivery delay (0-900 seconds)
 * @returns {Promise<object>} SQS send result with messageId
 */
export async function queueEmail({ to, subject, html, from, replyTo, delaySeconds = 0 }) {
  if (!EMAIL_QUEUE_URL) {
    // Fallback to direct send if queue URL is not configured (local dev)
    console.warn('[EmailService] EMAIL_QUEUE_URL not configured, sending directly');
    return await sendEmail({ to, subject, html, from, replyTo });
  }

  const messageBody = JSON.stringify({
    to,
    subject,
    html,
    from: from || DEFAULT_SENDER,
    replyTo: replyTo || null,
    queuedAt: new Date().toISOString(),
  });

  const command = new SendMessageCommand({
    QueueUrl: EMAIL_QUEUE_URL,
    MessageBody: messageBody,
    DelaySeconds: Math.min(delaySeconds, 900),
    MessageAttributes: {
      emailType: {
        DataType: 'String',
        StringValue: 'transactional',
      },
    },
  });

  const result = await sqsClient.send(command);

  console.log('[EmailService] Email queued:', {
    messageId: result.MessageId,
    to,
    subject,
  });

  return { messageId: result.MessageId, queued: true };
}

/**
 * Sends an SES email with exponential backoff retry logic.
 *
 * @param {object} params - SES SendEmail command parameters
 * @returns {Promise<object>} SES response with MessageId
 * @throws {Error} After MAX_RETRIES attempts are exhausted
 */
async function sendWithRetry(params) {
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const command = new SendEmailCommand(params);
      const result = await sesClient.send(command);

      console.log('[EmailService] Email sent:', {
        messageId: result.MessageId,
        to: params.Destination.ToAddresses,
        subject: params.Message.Subject.Data,
        attempt,
      });

      return { messageId: result.MessageId, sent: true };
    } catch (error) {
      lastError = error;

      // Don't retry on client errors (invalid address, etc.)
      if (isNonRetryableError(error)) {
        console.error('[EmailService] Non-retryable error:', {
          code: error.name || error.code,
          message: error.message,
          to: params.Destination.ToAddresses,
        });
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s
      if (attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
        console.warn(`[EmailService] Attempt ${attempt} failed, retrying in ${delay}ms:`, {
          error: error.message,
          to: params.Destination.ToAddresses,
        });
        await sleep(delay);
      }
    }
  }

  console.error('[EmailService] All retry attempts exhausted:', {
    error: lastError.message,
    to: params.Destination.ToAddresses,
    subject: params.Message.Subject.Data,
  });

  throw lastError;
}

/**
 * Determines if an SES error should not be retried.
 * Client errors (4xx) like invalid addresses are not retryable.
 * Throttling and server errors (5xx) are retryable.
 *
 * @param {Error} error - The SES error
 * @returns {boolean} True if the error should not be retried
 */
function isNonRetryableError(error) {
  const nonRetryableCodes = [
    'MessageRejected',
    'MailFromDomainNotVerifiedException',
    'ConfigurationSetDoesNotExistException',
    'AccountSendingPausedException',
    'InvalidParameterValue',
  ];

  return nonRetryableCodes.includes(error.name) || nonRetryableCodes.includes(error.code);
}

/**
 * Utility sleep function for retry delays.
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Template-Based Email Helpers ────────────────────────────────────────────

/**
 * Sends a welcome email to a newly registered user.
 *
 * @param {string} email - Recipient email
 * @param {string} userName - User's display name
 * @returns {Promise<object>} Send result
 */
export async function sendWelcomeEmail(email, userName) {
  const template = welcomeEmail(userName, email);
  return await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
  });
}

/**
 * Sends a team invitation email.
 *
 * @param {string} recipientEmail - Invitee's email
 * @param {string} inviterName - Name of the person who sent the invite
 * @param {string} teamName - Name of the team
 * @param {string} inviteLink - URL to accept the invitation
 * @returns {Promise<object>} Send result (queued via SQS)
 */
export async function sendTeamInviteEmail(recipientEmail, inviterName, teamName, inviteLink) {
  const template = teamInviteEmail(inviterName, teamName, inviteLink, recipientEmail);
  return await queueEmail({
    to: recipientEmail,
    subject: template.subject,
    html: template.html,
  });
}

/**
 * Sends a password reset email.
 * Sent directly (not queued) because password resets are time-sensitive.
 *
 * @param {string} email - Recipient email
 * @param {string} userName - User's display name
 * @param {string} resetLink - Password reset URL
 * @returns {Promise<object>} Send result
 */
export async function sendPasswordResetEmail(email, userName, resetLink) {
  const template = passwordResetEmail(userName, resetLink);
  return await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
  });
}

/**
 * Sends a task assignment notification email.
 *
 * @param {string} email - Assignee's email
 * @param {string} userName - Assignee's display name
 * @param {string} taskTitle - Title of the assigned task
 * @param {string} taskDescription - Task description
 * @param {string} assignedBy - Name of the person who assigned the task
 * @param {string} taskLink - URL to view the task
 * @returns {Promise<object>} Send result (queued via SQS)
 */
export async function sendTaskAssignedEmail(email, userName, taskTitle, taskDescription, assignedBy, taskLink) {
  const template = taskAssignedEmail(userName, taskTitle, taskDescription, assignedBy, taskLink);
  return await queueEmail({
    to: email,
    subject: template.subject,
    html: template.html,
  });
}

/**
 * Processes an email message from the SQS queue.
 * Called by the email-processor Lambda when consuming from the email queue.
 *
 * @param {object} message - Parsed SQS message body
 * @returns {Promise<object>} Send result
 */
export async function processQueuedEmail(message) {
  const { to, subject, html, from, replyTo } = message;

  if (!to || !subject || !html) {
    throw new Error('Invalid queued email message: missing required fields (to, subject, html)');
  }

  return await sendEmail({ to, subject, html, from, replyTo });
}

export default {
  sendEmail,
  queueEmail,
  sendWelcomeEmail,
  sendTeamInviteEmail,
  sendPasswordResetEmail,
  sendTaskAssignedEmail,
  processQueuedEmail,
};
