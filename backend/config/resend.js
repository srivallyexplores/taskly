import { Resend } from 'resend';

// Initialize Resend client
let resendClient = null;

const getResendClient = () => {
  if (!resendClient && process.env.RESEND_API_KEY) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
};

/**
 * Send email using Resend service
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML email content
 * @param {string} options.text - Plain text email content (optional)
 * @returns {Promise<Object>} - Result object with success status and id or error
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  // Check if Resend API key is configured
  if (!process.env.RESEND_API_KEY) {
    ////console.warn('   Resend API key not configured. Email functionality disabled.');
    return { 
      success: false, 
      message: 'Email service not configured',
      code: 'EMAIL_SERVICE_NOT_CONFIGURED'
    };
  }

  try {
    const resend = getResendClient();
    
    if (!resend) {
      throw new Error('Failed to initialize Resend client');
    }

    const emailFrom = process.env.EMAIL_FROM || 'Taskly <onboarding@resend.dev>';

    const data = await resend.emails.send({
      from: emailFrom,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version if not provided
    });

    //console.log(' Email sent via Resend:', data.id);
    return { 
      success: true, 
      id: data.id,
      message: 'Email sent successfully'
    };
  } catch (error) {
    //console.error(' Resend error:', error.message);
    
    // Log full error in development
    if (process.env.NODE_ENV === 'development') {
      //console.error('Full error:', error);
    }

    return { 
      success: false, 
      error: error.message,
      code: 'EMAIL_SEND_ERROR'
    };
  }
};

/**
 * Send email with retry logic
 * @param {Object} options - Email options
 * @param {number} maxRetries - Maximum number of retries (default: 3)
 * @returns {Promise<Object>} - Result object
 */
export const sendEmailWithRetry = async (options, maxRetries = 3) => {
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await sendEmail(options);
      if (result.success) {
        return result;
      }
      lastError = result;
    } catch (error) {
      lastError = { success: false, error: error.message };
      //console.warn(`Email send attempt ${attempt} failed:`, error.message);
    }

    // Wait before retrying (exponential backoff)
    if (attempt < maxRetries) {
      const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  //console.error(`Failed to send email after ${maxRetries} attempts`);
  return lastError || { success: false, error: 'Failed to send email' };
};

export default sendEmail;
