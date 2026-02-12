const Joi = require('joi');

const { getClientIp, getFingerprint } = require('../utils/frontendInfo');

const AuthService = require('../services/authService');
const AdminService = require('../services/adminService');
const BookkeeperService = require('../services/bookkeeperService');
const UserService = require('../services/userService');
const SyndicatorService = require('../services/syndicatorService');
const RepresentativeService = require('../services/representativeService');
const ContactService = require('../services/contactService');

const BookkeeperFunderService = require('../services/bookkeeperFunderService');
const UserFunderService = require('../services/userFunderService');
const UserLenderService = require('../services/userLenderService');
const RepresentativeISOService = require('../services/representativeISOService');
const ContactMerchantService = require('../services/contactMerchantService');

const ErrorResponse = require('../utils/errorResponse');
const { PORTAL_TYPES } = require('../utils/constants');
const { ROLES, checkUserPermissions } = require('../utils/permissions');

/**
 * Precheck login
 * @param {Function} loginHandler - The login handler function
 * @returns {Function} - Express middleware function
 */
exports.precheckLogin = (loginHandler) => {
    return async (req, res, next) => {
        const schema = Joi.object({
            email: Joi.string().email().required(),
            password: Joi.string().required()
        });

        const { value, error } = schema.validate(req.body);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        value.clientIp = getClientIp(req);
        value.fingerprint = getFingerprint(req);

        loginHandler(value, res, next);
    };
};

/**
 * Login Admin
 * @param {Object} value - The value object
 * @param {Object} res - The response object
 * @param {Function} next - The next function
 * @returns {Object} - The response object
 */
exports.loginAdmin = async (value, res, next) => {
    try {
        const { email, password, clientIp, fingerprint } = value;

        const admin = await AdminService.loginAdmin(email, password, clientIp);

        // Send token response
        await sendTokenResponse(admin, 200, res, PORTAL_TYPES.ADMIN, fingerprint);
    } catch (err) {
        next(err);
    }
};

/**
 * Login Bookkeeper
 * @param {Object} value - The value object
 * @param {Object} res - The response object
 * @param {Function} next - The next function
 * @returns {Object} - The response object
 */
exports.loginBookkeeper = async (value, res, next) => {
    try {
        const { email, password, clientIp, fingerprint } = value;

        const bookkeeper = await BookkeeperService.loginBookkeeper(email, password, clientIp);

        // Send token response
        await sendTokenResponse(bookkeeper, 200, res, PORTAL_TYPES.BOOKKEEPER, fingerprint);
    } catch (err) {
        next(err);
    }
};


/**
 * Login Funder User
 * @param {Object} value - The value object
 * @param {Object} res - The response object
 * @param {Function} next - The next function
 * @returns {Object} - The response object
 */
exports.loginFunder = async (value, res, next) => {
    try {
        const { email, password, clientIp, fingerprint } = value;

        const user = await UserService.loginUser(email, password, clientIp);

        // Send token response
        await sendTokenResponse(user, 200, res, PORTAL_TYPES.FUNDER, fingerprint);
    } catch (err) {
        next(err);
    }
};

/**
 * Login Syndicator
 * @param {Object} value - The value object
 * @param {Object} res - The response object
 * @param {Function} next - The next function
 * @returns {Object} - The response object
 */
exports.loginSyndicator = async (value, res, next) => {
    try {
        const { email, password, clientIp, fingerprint } = value;

        const syndicator = await SyndicatorService.loginSyndicator(email, password, clientIp);

        // Send token response
        await sendTokenResponse(syndicator, 200, res, PORTAL_TYPES.SYNDICATOR, fingerprint);
    } catch (err) {
        next(err);
    }
};

/**
 * Login ISO
 * @param {Object} value - The value object
 * @param {Object} res - The response object
 * @param {Function} next - The next function
 * @returns {Object} - The response object
 */
exports.loginISO = async (value, res, next) => {
    try {
        const { email, password, clientIp, fingerprint } = value;

        const representative = await RepresentativeService.loginRepresentative(email, password, clientIp);

        // Send token response
        await sendTokenResponse(representative, 200, res, PORTAL_TYPES.ISO, fingerprint);
    } catch (err) {
        next(err);
    }
};

/**
 * Login Merchant
 * @param {Object} value - The value object
 * @param {Object} res - The response object
 * @param {Function} next - The next function
 * @returns {Object} - The response object
 */
exports.loginMerchant = async (value, res, next) => {
    try {
        const { email, password, clientIp, fingerprint } = value;

        const contact = await ContactService.loginContact(email, password, clientIp);

        // Send token response
        await sendTokenResponse(contact, 200, res, PORTAL_TYPES.MERCHANT, fingerprint);
    } catch (err) {
        next(err);
    }
};

// Get token, create cookie and send response
// @todo change this into other place
const sendTokenResponse = async (user, statusCode, res, portal, fingerprint) => {
    // According to the portal and user, we need to setup the filter for the token
    let filter;
    let role;
    
    switch (portal) {
    case PORTAL_TYPES.ADMIN:
        role = ROLES.ADMIN;
        break;
    case PORTAL_TYPES.BOOKKEEPER:
        role = ROLES.BOOKKEEPER;
        filter = { funder_list: await BookkeeperFunderService.getFundersByBookkeeperId(user._id) };
        break;
    case PORTAL_TYPES.FUNDER:
        role = user.type || ROLES.FUNDER_USER;
        filter = {
            funder_list: await UserFunderService.getFundersByUserId(user._id),
            lender_list: await UserLenderService.getLendersByUserId(user._id)
        };

        // If the user has only one funder, set the funder in the filter
        if (filter.funder_list.length === 1) {
            filter.funder = filter.funder_list[0];
        }

        break;
    case PORTAL_TYPES.ISO:
        role = user.type || ROLES.ISO_SALES;
        filter = { iso_list: await RepresentativeISOService.getISOsByRepresentativeId(user._id) };
        break;
    case PORTAL_TYPES.MERCHANT:
        role = ROLES.MERCHANT;
        filter = { merchant_list: await ContactMerchantService.getMerchantsByContactId(user._id) };
        break;
    case PORTAL_TYPES.SYNDICATOR:
        role = ROLES.SYNDICATOR;
        filter = { syndicator_list: [user._id] };
        break;
    }

    // Create access token
    const accessToken = AuthService.generateAccessToken(user._id, portal, role, filter, fingerprint);

    // Create refresh token
    const refreshToken = await AuthService.generateRefreshToken(user._id, portal, role, filter, fingerprint);

    // Set refresh token in HttpOnly cookie
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
    });

    // Send response, handle the funder portal differently for users with funder in filter
    if (portal === PORTAL_TYPES.FUNDER && filter.funder) {
        res.status(statusCode).json({
            success: true,
            accessToken,
            funder: filter.funder
        });
    } else {
        res.status(statusCode).json({
            success: true,
            accessToken
        });
    }
};

/**
 * Precheck logout
 * @param {Function} logoutHandler - The logout handler function
 * @returns {Function} - Express middleware function
 */
exports.precheckLogout = (logoutHandler) => {
    return async (req, res, next) => {
        let accessToken;
        const clientIp = getClientIp(req);

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            accessToken = req.headers.authorization.split(' ')[1];
        }

        if (!accessToken) {
            return next(new ErrorResponse('You are not logged in! Please log in to get access.', 401));
        }

        try {
            const decoded = await AuthService.verifyAccessToken(accessToken, getFingerprint(req));

            const refreshToken = req.cookies.refreshToken;

            // Revoke the refresh token
            await AuthService.revokeRefreshToken(refreshToken);

            res.clearCookie('refreshToken');

            logoutHandler(decoded.id, clientIp, res, next);
        } catch (err) {
            if (err instanceof ErrorResponse) {
                return next(err);
            }

            return next(new ErrorResponse('Not authorized to access this route', 401));
        }
    };
};

/**
 * Logout Admin
 * @param {String} id - The admin id
 * @param {String} clientIp - The client ip
 * @param {Object} res - The response object
 * @param {Function} next - The next function
 */
exports.logoutAdmin = async (id, clientIp, res, next) => {
    try {
        await AdminService.logoutAdmin(id, clientIp);

        // Send response
        res.status(200).json({
            success: true,
            message: 'You have been logged out successfully'
        });
    } catch (err) {
        return next(new ErrorResponse('Not authorized to access this route', 401));
    }
};

/**
 * Logout Bookkeeper
 * @param {String} id - The bookkeeper id
 * @param {String} clientIp - The client ip
 * @param {Object} res - The response object
 * @param {Function} next - The next function
 */
exports.logoutBookkeeper = async (id, clientIp, res, next) => {
    try {
        await BookkeeperService.logoutBookkeeper(id, clientIp);

        // Send response
        res.status(200).json({
            success: true,
            message: 'You have been logged out successfully'
        });
    } catch (err) {
        return next(new ErrorResponse('Not authorized to access this route', 401));
    }
};


/**
 * Logout User
 * @param {String} id - The user id
 * @param {String} clientIp - The client ip
 * @param {Object} res - The response object
 * @param {Function} next - The next function
 */
exports.logoutFunder = async (id, clientIp, res, next) => {
    try {
        await UserService.logoutUser(id, clientIp);

        // Send response
        res.status(200).json({
            success: true,
            message: 'You have been logged out successfully'
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Logout Syndicator
 * @param {String} id - The syndicator id
 * @param {String} clientIp - The client ip
 * @param {Object} res - The response object
 * @param {Function} next - The next function
 */
exports.logoutSyndicator = async (id, clientIp, res, next) => {
    try {
        await SyndicatorService.logoutSyndicator(id, clientIp);

        // Send response
        res.status(200).json({
            success: true,
            message: 'You have been logged out successfully'
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Logout ISO
 * @param {String} id - The representative id
 * @param {String} clientIp - The client ip
 * @param {Object} res - The response object
 * @param {Function} next - The next function
 */
exports.logoutISO = async (id, clientIp, res, next) => {
    try {
        await RepresentativeService.logoutRepresentative(id, clientIp);

        // Send response
        res.status(200).json({
            success: true,
            message: 'You have been logged out successfully'
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Logout Merchant
 * @param {String} id - The contact id
 * @param {String} clientIp - The client ip
 * @param {Object} res - The response object
 * @param {Function} next - The next function
 */
exports.logoutMerchant = async (id, clientIp, res, next) => {
    try {
        await ContactService.logoutContact(id, clientIp);

        // Send response
        res.status(200).json({
            success: true,
            message: 'You have been logged out successfully'
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Refresh the Access Token
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {Function} next - The next function
 */
exports.refreshAccessToken = async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        const fingerprint = getFingerprint(req);

        const accessToken = await AuthService.refreshAccessToken(refreshToken, fingerprint);

        res.status(200).json({
            success: true,
            accessToken
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Check if user has required permissions
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {Function} next - The next function
 */
exports.checkPermissions = async (req, res, next) => {
    try {
        const { permissions } = req.body;

        if (!permissions || !Array.isArray(permissions)) {
            return next(new ErrorResponse('Permissions array is required', 400));
        }

        const results = checkUserPermissions(req.role, req.user, permissions);

        res.status(200).json({
            success: true,
            data: results
        });
    } catch (err) {
        next(err);
    }
};
