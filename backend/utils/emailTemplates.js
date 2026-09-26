// Email template utilities

const baseStyles = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #333;
    background-color: #f4f4f4;
    margin: 0;
    padding: 0;
  }
  .container {
    max-width: 600px;
    margin: 40px auto;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  .header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 40px 30px;
    text-align: center;
  }
  .header h1 {
    margin: 0;
    font-size: 32px;
    font-weight: 700;
  }
  .content {
    padding: 40px 30px;
  }
  .content h2 {
    color: #333;
    font-size: 24px;
    margin-top: 0;
  }
  .content p {
    color: #666;
    font-size: 16px;
    margin: 16px 0;
  }
  .button {
    display: inline-block;
    padding: 14px 32px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 600;
    margin: 20px 0;
  }
  .footer {
    background: #f8f9fa;
    padding: 30px;
    text-align: center;
    color: #999;
    font-size: 14px;
  }
  .footer a {
    color: #667eea;
    text-decoration: none;
  }
  .divider {
    height: 1px;
    background: #e0e0e0;
    margin: 30px 0;
  }
  .highlight {
    background: #f0f4ff;
    padding: 20px;
    border-radius: 6px;
    border-left: 4px solid #667eea;
    margin: 20px 0;
  }
`;

// Welcome email template
export const welcomeEmail = (userName, userEmail) => {
  return {
    subject: 'Welcome to Taskly! 🎉',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${baseStyles}</style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Taskly!</h1>
          </div>
          <div class="content">
            <h2>Hi ${userName}! 👋</h2>
            <p>
              We're thrilled to have you on board! Taskly is your new home for organizing tasks, 
              collaborating with teams, and boosting productivity.
            </p>
            
            <div class="highlight">
              <strong>🚀 Get Started:</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Create your first task</li>
                <li>Set up your profile</li>
                <li>Invite team members</li>
                <li>Explore productivity features</li>
              </ul>
            </div>

            <p style="text-align: center;">
              <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}" class="button">
                Go to Dashboard
              </a>
            </p>

            <div class="divider"></div>

            <p style="font-size: 14px; color: #999;">
              <strong>Need help?</strong> Check out our 
              <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/help" style="color: #667eea;">
                Help Center
              </a> or reply to this email.
            </p>
          </div>
          <div class="footer">
            <p>
              You're receiving this email because you signed up for Taskly.<br>
              <strong>Account:</strong> ${userEmail}
            </p>
            <p>
              <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}">Visit Taskly</a> | 
              <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/settings">Settings</a>
            </p>
            <p style="margin-top: 20px;">
              © ${new Date().getFullYear()} Taskly. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
};

// Team invitation email template
export const teamInviteEmail = (inviterName, teamName, inviteLink, recipientEmail) => {
  return {
    subject: `${inviterName} invited you to join ${teamName} on Taskly`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${baseStyles}</style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Team Invitation</h1>
          </div>
          <div class="content">
            <h2>You've been invited! 🎊</h2>
            <p>
              <strong>${inviterName}</strong> has invited you to join the team 
              <strong>${teamName}</strong> on Taskly.
            </p>
            
            <div class="highlight">
              <p style="margin: 0;">
                <strong>Team:</strong> ${teamName}<br>
                <strong>Invited by:</strong> ${inviterName}<br>
                <strong>Your email:</strong> ${recipientEmail}
              </p>
            </div>

            <p>
              Join your team to collaborate on projects, share tasks, and boost productivity together.
            </p>

            <p style="text-align: center;">
              <a href="${inviteLink}" class="button">
                Accept Invitation
              </a>
            </p>

            <p style="font-size: 14px; color: #999; text-align: center;">
              Or copy and paste this link into your browser:<br>
              <a href="${inviteLink}" style="color: #667eea; word-break: break-all;">
                ${inviteLink}
              </a>
            </p>

            <div class="divider"></div>

            <p style="font-size: 14px; color: #999;">
              <strong>Note:</strong> This invitation link will expire in 7 days.
            </p>
          </div>
          <div class="footer">
            <p>
              You're receiving this email because ${inviterName} invited you to Taskly.<br>
              If you don't want to join this team, you can safely ignore this email.
            </p>
            <p>
              <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}">Visit Taskly</a>
            </p>
            <p style="margin-top: 20px;">
              © ${new Date().getFullYear()} Taskly. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
};

// Password reset email template
export const passwordResetEmail = (userName, resetLink) => {
  return {
    subject: 'Reset Your Taskly Password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${baseStyles}</style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset</h1>
          </div>
          <div class="content">
            <h2>Hi ${userName},</h2>
            <p>
              We received a request to reset your Taskly password. Click the button below to 
              create a new password:
            </p>

            <p style="text-align: center;">
              <a href="${resetLink}" class="button">
                Reset Password
              </a>
            </p>

            <p style="font-size: 14px; color: #999; text-align: center;">
              Or copy and paste this link into your browser:<br>
              <a href="${resetLink}" style="color: #667eea; word-break: break-all;">
                ${resetLink}
              </a>
            </p>

            <div class="divider"></div>

            <div class="highlight">
              <p style="margin: 0;">
                <strong>  Security Notice:</strong><br>
                This link will expire in 1 hour for security reasons.<br>
                If you didn't request this reset, please ignore this email.
              </p>
            </div>
          </div>
          <div class="footer">
            <p>
              You're receiving this email because a password reset was requested for your account.
            </p>
            <p>
              <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}">Visit Taskly</a>
            </p>
            <p style="margin-top: 20px;">
              © ${new Date().getFullYear()} Taskly. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
};

// Task assignment notification email
export const taskAssignedEmail = (userName, taskTitle, taskDescription, assignedBy, taskLink) => {
  return {
    subject: `New Task Assigned: ${taskTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${baseStyles}</style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Task Assigned</h1>
          </div>
          <div class="content">
            <h2>Hi ${userName},</h2>
            <p>
              <strong>${assignedBy}</strong> has assigned you a new task:
            </p>
            
            <div class="highlight">
              <h3 style="margin: 0 0 10px 0; color: #333;">${taskTitle}</h3>
              <p style="margin: 0; color: #666;">
                ${taskDescription || 'No description provided'}
              </p>
            </div>

            <p style="text-align: center;">
              <a href="${taskLink}" class="button">
                View Task
              </a>
     
          </p>

            <div class="divider"></div>

            <p style="font-size: 14px; color: #999;">
              <strong>Need help?</strong> Reply to this email or contact your team admin.
            </p>
          </div>
          <div class="footer">
            <p>
              You're receiving this email because you were assigned a task on Taskly.
            </p>
            <p>
              <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}">Visit Taskly</a>
            </p>
            <p style="margin-top: 20px;">
              © ${new Date().getFullYear()} Taskly. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
};
