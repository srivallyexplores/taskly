import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

/**
 * Email Processor — SQS Queue Consumer
 *
 * Processes messages from the email SQS queue and sends emails via SES.
 * This Lambda is triggered by SQS event source mapping, processing
 * batches of email messages.
 *
 * Supports email types:
 * - team_member_joined: Notify team owner of new member
 * - invitation_received: Notify user of team invitation
 * - task_reminder: Remind user of upcoming task deadline
 * - password_reset: Send password reset link
 *
 *  7.5, 6.3, 6.5
 */

const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

const FROM_EMAIL = process.env.SES_FROM_EMAIL || 'noreply@taskly.app';
const APP_NAME = 'Taskly';

// ─── Email Templates ─────────────────────────────────────────────────────────

const templates = {
  team_member_joined: (data) => ({
    subject: `${data.memberName} joined your team "${data.teamName}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Team Member</h2>
        <p>Hi ${data.ownerName},</p>
        <p><strong>${data.memberName}</strong> has joined your team <strong>"${data.teamName}"</strong> as a ${data.role}.</p>
        <p>You can manage your team members in the ${APP_NAME} dashboard.</p>
        <p>— The ${APP_NAME} Team</p>
      </div>
    `,
    text: `Hi ${data.ownerName}, ${data.memberName} has joined your team "${data.teamName}" as a ${data.role}.`,
  }),

  invitation_received: (data) => ({
    subject: `You've been invited to join "${data.teamName}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Team Invitation</h2>
        <p>Hi ${data.inviteeName},</p>
        <p><strong>${data.inviterName}</strong> has invited you to join the team <strong>"${data.teamName}"</strong>.</p>
        ${data.message ? `<p>Message: "${data.message}"</p>` : ''}
        <p>Log in to ${APP_NAME} to accept or decline this invitation.</p>
        <p>— The ${APP_NAME} Team</p>
      </div>
    `,
    text: `Hi ${data.inviteeName}, ${data.inviterName} has invited you to join "${data.teamName}". Log in to Taskly to respond.`,
  }),

  task_reminder: (data) => ({
    subject: `Reminder: "${data.taskTitle}" is due ${data.dueText}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Task Reminder</h2>
        <p>Hi ${data.userName},</p>
        <p>Your task <strong>"${data.taskTitle}"</strong> is due <strong>${data.dueText}</strong>.</p>
        <p>Priority: ${data.priority}</p>
        <p>Log in to ${APP_NAME} to update your task status.</p>
        <p>— The ${APP_NAME} Team</p>
      </div>
    `,
    text: `Hi ${data.userName}, your task "${data.taskTitle}" is due ${data.dueText}. Priority: ${data.priority}.`,
  }),

  password_reset: (data) => ({
    subject: `Reset your ${APP_NAME} password`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset</h2>
        <p>Hi ${data.userName},</p>
        <p>We received a request to reset your password. Click the link below to set a new password:</p>
        <p><a href="${data.resetLink}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Reset Password</a></p>
        <p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
        <p>— The ${APP_NAME} Team</p>
      </div>
    `,
    text: `Hi ${data.userName}, reset your password here: ${data.resetLink}. This link expires in 1 hour.`,
  }),
};

// ─── Handler ─────────────────────────────────────────────────────────────────

/**
 * Lambda handler for SQS email queue messages.
 * Processes a batch of SQS records, sending each email via SES.
 *
 * @param {object} event - SQS event with Records array
 * @param {object} context - Lambda context
 * @returns {object} Batch item failures for partial retry
 */
export async function handler(event, context) {
  context.callbackWaitsForEmptyEventLoop = false;

  const startTime = Date.now();
  const records = event.Records || [];
  const batchItemFailures = [];

  console.log('[EmailProcessor] Processing batch:', {
    recordCount: records.length,
    requestId: context.awsRequestId,
  });

  for (const record of records) {
    try {
      const message = JSON.parse(record.body);
      await sendEmail(message);
    } catch (error) {
      console.error('[EmailProcessor] Failed to process record:', {
        messageId: record.messageId,
        error: error.message,
      });

      // Report as batch item failure for individual retry
      batchItemFailures.push({
        itemIdentifier: record.messageId,
      });
    }
  }

  const duration = Date.now() - startTime;
  console.log('[EmailProcessor] Batch complete:', {
    total: records.length,
    succeeded: records.length - batchItemFailures.length,
    failed: batchItemFailures.length,
    durationMs: duration,
  });

  // Return partial batch failure response
  // SQS will retry only the failed messages
  return { batchItemFailures };
}

// ─── Email Sending ───────────────────────────────────────────────────────────

async function sendEmail(message) {
  const { type, to, data } = message;

  if (!to) {
    throw new Error('Missing recipient email address');
  }

  const templateFn = templates[type];
  if (!templateFn) {
    throw new Error(`Unknown email template type: ${type}`);
  }

  const { subject, html, text } = templateFn(data);

  const command = new SendEmailCommand({
    Source: FROM_EMAIL,
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Subject: { Data: subject, Charset: 'UTF-8' },
      Body: {
        Html: { Data: html, Charset: 'UTF-8' },
        Text: { Data: text, Charset: 'UTF-8' },
      },
    },
  });

  const response = await sesClient.send(command);

  console.log('[EmailProcessor] Email sent:', {
    type,
    to,
    messageId: response.MessageId,
  });

  return response;
}

export default { handler };
