const EmailVerification = require("../models/EmailVerification");
const {
  generateVerificationCode,
  sendVerificationEmail,
  sendWelcomeEmail,
} = require("./emailService");
const ErrorResponse = require("../utils/errorResponse");
const User = require("../models/User");

// Create email verification record
const createEmailVerification = async (email) => {
  try {
    // Check if user already exists with this email
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new ErrorResponse("User already exists with this email", 400);
    }

    // Delete any existing verification records for this email
    await EmailVerification.deleteMany({ email });

    // Generate new verification code
    const verificationCode = generateVerificationCode();

    // Create new verification record
    const emailVerification = new EmailVerification({
      email,
      verificationCode,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
    });

    await emailVerification.save();

    // Send verification email with code
    await sendVerificationEmail(email, verificationCode);

    return {
      success: true,
      message: "Verification email sent successfully",
      email: email,
    };
  } catch (error) {
    throw error;
  }
};

// Verify email with 6-digit code
const verifyEmailWithCode = async (email, verificationCode) => {
  try {
    // Find verification record
    const emailVerification = await EmailVerification.findOne({
      email,
      verificationCode,
      isVerified: false,
    });

    if (!emailVerification) {
      throw new ErrorResponse("Invalid verification code", 400);
    }

    // Check if code has expired
    if (emailVerification.expiresAt < new Date()) {
      // Delete expired record
      await EmailVerification.deleteOne({ _id: emailVerification._id });
      throw new ErrorResponse("Verification code has expired", 400);
    }

    // Mark as verified
    emailVerification.isVerified = true;
    emailVerification.verifiedAt = new Date();
    await emailVerification.save();

    // Send welcome email
    await sendWelcomeEmail(emailVerification.email, "User");

    return {
      success: true,
      message: "Email verified successfully",
      email: emailVerification.email,
    };
  } catch (error) {
    throw error;
  }
};

const cleanupExpiredVerifications = async () => {
  try {
    const result = await EmailVerification.deleteMany({
      expiresAt: { $lt: new Date() },
    });
    
    return result.deletedCount;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createEmailVerification,
  verifyEmailWithCode,
  cleanupExpiredVerifications,
};
