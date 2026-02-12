const nodemailer = require("nodemailer");
const crypto = require("crypto");
const emailTemplates = require("../templates/emailTemplates");

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Generate 6-digit verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generic send email function
const sendEmail = async (to, subject, html, from = null) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: from || `"MCA CRM" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    };

    const result = await transporter.sendMail(mailOptions);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    throw new Error(`Failed to send email to ${to}`);
  }
};

// Send verification email with 6-digit code
const sendVerificationEmail = async (email, verificationCode) => {
  const html = emailTemplates.emailVerificationCode(verificationCode);

  return await sendEmail(email, "Verify Your Email - MCA CRM", html);
};

// Send welcome email after successful verification
const sendWelcomeEmail = async (email, firstName = "User") => {
  const loginUrl = `${process.env.FRONTEND_URL}/login`;
  const html = emailTemplates.welcome(firstName, loginUrl);

  return await sendEmail(email, "Welcome to MCA CRM!", html);
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  const html = emailTemplates.passwordReset(resetUrl);

  return await sendEmail(email, "Password Reset Request - MCA CRM", html);
};

// Send notification email
const sendNotificationEmail = async (
  email,
  title,
  message,
  actionUrl = null,
  actionText = null
) => {
  const html = emailTemplates.notification(
    title,
    message,
    actionUrl,
    actionText
  );

  return await sendEmail(email, `${title} - MCA CRM`, html);
};

module.exports = {
  generateVerificationCode,
  sendEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendNotificationEmail,
};
