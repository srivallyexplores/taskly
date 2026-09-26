import nodemailer from 'nodemailer';

// Email configuration
const emailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
};

// Create reusable transporter
let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      //console.warn(' Email credentials not configured. Email functionality will be disabled.');
      return null;
    }

    transporter = nodemailer.createTransport(emailConfig);

    // Verify connection configuration
    transporter.verify((error, success) => {
      if (error) {
        //console.error(' Email configuration error:', error.message);
      } else {
        //console.log(' Email server is ready to send messages');
      }
    });
  }

  return transporter;
};

// Send email function
const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = getTransporter();

  if (!transporter) {
    //console.warn('  Email not sent - transporter not configured');
    return { success: false, message: 'Email service not configured' };
  }

  try {
    const mailOptions = {
      from: `"Taskly" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    };

    const info = await transporter.sendMail(mailOptions);
    //console.log(' Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    //console.error(' Error sending email:', error.message);
    return { success: false, error: error.message };
  }
};

export { sendEmail, getTransporter };
export default sendEmail;
