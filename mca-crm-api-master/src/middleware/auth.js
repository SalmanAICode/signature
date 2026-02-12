const AuthService = require('../services/authService');
const AdminService = require('../services/adminService');
const BookkeeperService = require('../services/bookkeeperService');
const UserService = require('../services/userService');
const SyndicatorService = require('../services/syndicatorService');
const RepresentativeService = require('../services/representativeService');
const ContactService = require('../services/contactService');

const { PORTAL_TYPES } = require('../utils/constants');
const { checkUserPermissions } = require('../utils/permissions');
const { getFingerprint } = require('../utils/frontendInfo');

const Helpers = require('../utils/helpers');
const ErrorResponse = require('../utils/errorResponse');


// Protect routes
exports.protect = async (req, res, next) => {
    let accessToken;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        // Set token from Bearer token in header
        accessToken = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!accessToken) {
        // If in development mode, try to get access token from refresh token once
        if (process.env.NODE_ENV === 'development') {
            const refreshToken = req.cookies.refreshToken;
            if (refreshToken) {
                try {
                    accessToken = await AuthService.refreshAccessToken(refreshToken, getFingerprint(req));
                } catch (err) {
                    return next(new ErrorResponse(err.message, 401));
                }
            }
        }

        if (!accessToken) {
            return next(new ErrorResponse('Not authorized to access this route', 401));
        } else {
            req.headers.authorization = `Bearer ${accessToken}`;
        }
    }

    try {
        // Verify token
        const decoded = await AuthService.verifyAccessToken(accessToken, getFingerprint(req));

        // Check the portal type (admin, bookkeeper, funder, merchant, iso, syndicator)
        const { id, portal, role, filter } = decoded;

        switch (portal) {
        case PORTAL_TYPES.ADMIN:
            req.user = await AdminService.getAdminById(id);
            break;
        case PORTAL_TYPES.FUNDER:
            req.user = await UserService.getUserById(id);
            break;
        case PORTAL_TYPES.SYNDICATOR:
            req.user = await SyndicatorService.getSyndicatorById(id);
            break;
        case PORTAL_TYPES.BOOKKEEPER:
            req.user = await BookkeeperService.getBookkeeperById(id);
            break;
        case PORTAL_TYPES.MERCHANT:
            req.user = await ContactService.getContactById(id);
            break;
        case PORTAL_TYPES.ISO:
            req.user = await RepresentativeService.getRepresentativeById(id);
            break;
        default:
            return next(new ErrorResponse('Invalid portal type', 401));
        }

        req.id = id;
        req.portal = portal;
        req.role = role;
        req.filter = filter;

        if (!req.user) {
            return next(new ErrorResponse('User not found', 401));
        }

        next();
    } catch (err) {
        console.log(err);
        return next(new ErrorResponse('Not authorized to access this route', 401));
    }
};

// Grant access to specific route
exports.authorize = (requiredPermissions) => {
    return (req, res, next) => {
        const hasPermission = checkUserPermissions(req.role, req.user, requiredPermissions);
        
        if (!hasPermission) {
            return next(new ErrorResponse('Not authorized to perform this action', 403));
        }

        next();
    };
};

// Grant access if user has any of the given permissions
exports.authorizeAny = (permissionsArray) => {
    return (req, res, next) => {
        const result = checkUserPermissions(req.role, req.user, permissionsArray, false);
        const hasAny = Object.values(result).some(Boolean);
        if (!hasAny) {
            return next(new ErrorResponse('Not authorized to perform this action', 403));
        }
        next();
    };
};

// Access control with funder list, merchant list, or iso list if provided
exports.accessControl = (req, object, info = 'info') => {
    const { funder, funder_list, lender_list, merchant_list, iso_list, syndicator_list } = req.filter;

    if (!object) {
        throw new ErrorResponse(`${info} not found`, 404);
    }

    if ((funder || funder_list) && object.funder) {
        const funderId = Helpers.extractIdString(object.funder);
        if (!funderId) {
            //throw new ErrorResponse(`Cannot find funder id ${funderId}, access denied`, 403);
        } else if (funder && funder !== funderId) {
            throw new ErrorResponse(`You do not have permission to access this funder ${funderId}'s ${info}`, 403);
        } else if (funder_list && !funder_list.includes(funderId)) {
            throw new ErrorResponse(`You do not have permission to access this funder ${funderId}'s ${info}`, 403);
        }
    }

    if (lender_list && object.lender) {
        const lenderId = Helpers.extractIdString(object.lender);
        if (!lenderId) {
            //throw new ErrorResponse(`Cannot find lender id ${lenderId}, access denied`, 403);
        } else if (!lender_list.includes(lenderId)) {
            throw new ErrorResponse(`You do not have permission to access this lender ${lenderId}'s ${info}`, 403);
        }
    }

    if (merchant_list && object.merchant) {
        const merchantId = Helpers.extractIdString(object.merchant);
        if (!merchantId) {
            //throw new ErrorResponse(`Cannot find merchant id ${merchantId}, access denied`, 403);
        } else if (!merchant_list.includes(merchantId)) {
            throw new ErrorResponse(`You do not have permission to access this merchant ${merchantId}'s ${info}`, 403);
        }
    }

    if (iso_list && object.iso) {
        const isoId = Helpers.extractIdString(object.iso);        
        if (!isoId) {
            //throw new ErrorResponse(`Cannot find iso id ${isoId}, access denied`, 403);
        } else if (!iso_list.includes(isoId)) {
            throw new ErrorResponse(`You do not have permission to access this iso ${isoId}'s ${info}`, 403);
        }
    }

    if (syndicator_list) {
        if (object.syndicator) {
            const syndicatorId = Helpers.extractIdString(object.syndicator);
            if (!syndicatorId) {
                //throw new ErrorResponse(`Cannot find syndicator id ${syndicatorId}, access denied`, 403);
            } else if (!syndicator_list.includes(syndicatorId)) {
                throw new ErrorResponse(`You do not have permission to access this syndicator ${syndicatorId}'s ${info}`, 403);
            }
        } else if (object.syndicator_list) {
            const syndicatorIds = object.syndicator_list.map(syndicator => {
                return Helpers.extractIdString(syndicator);
            });
            if (!syndicatorIds.some(id => syndicator_list.includes(id))) {
                throw new ErrorResponse(`You do not have permission to access these syndicators ${syndicatorIds.join(', ')}'s ${info}`, 403);
            }
        }
    }
};