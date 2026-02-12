// Email templates for the MCA CRM system

const getBaseTemplate = (title, content) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h1 style="color: #333; margin: 0; text-align: center;">MCA CRM</h1>
    </div>
    
    <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h2 style="color: #333; margin-top: 0;">${title}</h2>
      ${content}
    </div>
    
    <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
      <p>This email was sent from MCA CRM system.</p>
      <p>If you have any questions, please contact our support team.</p>
    </div>
  </div>
`;

const getButtonStyle = (color = "#007bff") => `
  background-color: ${color}; 
  color: white; 
  padding: 12px 24px; 
  text-decoration: none; 
  border-radius: 5px; 
  display: inline-block;
  font-weight: bold;
`;

const templates = {
  // Email verification template with 6-digit code
  emailVerificationCode: (verificationCode) =>
    getBaseTemplate(
      "Email Verification Code",
      `
      <p>Hello,</p>
      <p>Thank you for registering with MCA CRM. Please use the following 6-digit code to verify your email address:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <div style="background-color: #f8f9fa; border: 2px solid #007bff; border-radius: 8px; padding: 20px; display: inline-block;">
          <h1 style="color: #007bff; margin: 0; font-size: 36px; letter-spacing: 8px; font-family: 'Courier New', monospace;">
            ${verificationCode}
          </h1>
        </div>
      </div>
      
      <p><strong>⚠️ This code will expire in 10 minutes.</strong></p>
      <p>Enter this code in the verification form to complete your registration.</p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #666; font-size: 14px;">
        If you didn't request this verification, please ignore this email.
      </p>
    `
    ),

  // Welcome email template
  welcome: (firstName, loginUrl) =>
    getBaseTemplate(
      "Welcome to MCA CRM!",
      `
      <p>Hello ${firstName || "User"},</p>
      <p>Your email has been successfully verified and your account is now active.</p>
      <p>You can now log in to the MCA CRM system using your credentials.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${loginUrl}" style="${getButtonStyle("#28a745")}">
          Login to MCA CRM
        </a>
      </div>
    `
    ),

  // Password reset template
  passwordReset: (resetUrl) =>
    getBaseTemplate(
      "Password Reset Request",
      `
      <p>Hello,</p>
      <p>You have requested to reset your password for your MCA CRM account.</p>
      <p>Click the button below to reset your password:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="${getButtonStyle("#dc3545")}">
          Reset Password
        </a>
      </div>
      
      <p>Or copy and paste this link in your browser:</p>
      <p style="word-break: break-all; color: #666; background-color: #f8f9fa; padding: 10px; border-radius: 4px;">
        ${resetUrl}
      </p>
      
      <p><strong>⚠️ This link will expire in 1 hour.</strong></p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #666; font-size: 14px;">
        If you didn't request this password reset, please ignore this email.
      </p>
    `
    ),

  // Notification template
  notification: (title, message, actionUrl = null, actionText = null) =>
    getBaseTemplate(
      title,
      `
      <p>${message}</p>
      ${
        actionUrl && actionText
          ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${actionUrl}" style="${getButtonStyle("#6c757d")}">
            ${actionText}
          </a>
        </div>
      `
          : ""
      }
    `
    ),
};

module.exports = templates;
