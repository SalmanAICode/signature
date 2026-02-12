const Joi = require("joi");
const EmailVerificationService = require("../services/emailVerificationService");
const { generateEmailVerificationToken } = require("../middleware/userCreationAuth");
const ErrorResponse = require("../utils/errorResponse");


exports.sendVerificationEmail = async (req, res, next) => {
  try {
    const schema = Joi.object({
      email: Joi.string().email().required(),
    });

    const { value, error } = schema.validate(req.body);

    if (error) {
      return next(new ErrorResponse(error.message, 400));
    }

    const { email } = value;

    const result = await EmailVerificationService.createEmailVerification(
      email
    );

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        email: result.email,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.verifyEmailWithCode = async (req, res, next) => {
  try {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      code: Joi.string().length(6).required(),
    });

    const { value, error } = schema.validate(req.body);

    if (error) {
      return next(new ErrorResponse(error.message, 400));
    }

    const { email, code } = value;

    const result = await EmailVerificationService.verifyEmailWithCode(
      email,
      code
    );

    // Generate JWT token for the verified email
    const jwtToken = generateEmailVerificationToken(result.email);

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        email: result.email,
        token: jwtToken,
        message:
          "Email verified successfully. You can now create your account.",
      },
    });
  } catch (err) {
    next(err);
  }
};
