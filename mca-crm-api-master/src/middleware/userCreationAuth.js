const jwt = require('jsonwebtoken');
const { getFingerprint } = require("../utils/frontendInfo");
const ErrorResponse = require("../utils/errorResponse");
const { ROLES } = require("../utils/permissions");

// Configuration for email verification JWT
const config = {
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET || 'default_secret',
    accessTokenExpiry: '30m', // 30 minutes
};

// Generate JWT for email verification
exports.generateEmailVerificationToken = (email) => {
    const payload = {
        email: email,
        portal: "funder",
        role: ROLES.PENDING_USER,
        filter: {},
        fingerprint: "email_verification",
        type: "email_verification"
    };
        
    return jwt.sign(payload, config.accessTokenSecret, {
        expiresIn: config.accessTokenExpiry
    });
};

// Verify JWT for user creation
exports.userCreationAuth = async (req, res, next) => {
    let accessToken;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        accessToken = req.headers.authorization.split(" ")[1];
    }

    if (!accessToken) {
        return next(new ErrorResponse("Not authorized to access this route", 401));
    }

    try {
        // Verify token using our own JWT verification
        const decoded = jwt.verify(accessToken, config.accessTokenSecret);

        // Check if this is an email verification token
        if (decoded.type !== "email_verification" || 
            decoded.portal !== "funder" || 
            decoded.role !== ROLES.PENDING_USER) {
            return next(
                new ErrorResponse("Invalid token for user creation", 401)
            );
        }

        const { email } = decoded;

        // Verify that the email in the token matches the email in the request body
        if (req.body.email && email && req.body.email !== email) {
            return next(
                new ErrorResponse(
                    "Email in request body must match the verified email in token",
                    400
                )
            );
        }

        // Set request properties
        req.email = email;
        req.portal = "funder";
        req.role = ROLES.PENDING_USER;
        req.filter = {};
        req.verifiedEmail = email;

        next();
    } catch (err) {
        return next(new ErrorResponse("Not authorized to access this route", 401));
    }
};
