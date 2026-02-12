const ContactAccessLog = require('../models/ContactAccessLog');
const mongoose = require('mongoose');

const ErrorResponse = require('../utils/errorResponse');
const Validators = require('../utils/validators');
const { PORTAL_OPERATIONS } = require('../utils/constants');

/**
 * Get all contact access logs with filtering and pagination
 */
exports.getContactAccessLogs = async (query, page = 1, limit = 10, sort = { access_date: -1 }, populate = [], select = '') => {
    const skip = (page - 1) * limit;
    
    const [contactAccessLogs, count] = await Promise.all([
        ContactAccessLog.find(query)
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .populate(populate)
            .select(select)
            .lean(),
        ContactAccessLog.countDocuments(query)
    ]);
    
    return {
        docs: contactAccessLogs,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalResults: count
        }
    };
};

/**
 * Get a list of contact access logs without pagination
 */
exports.getContactAccessLogList = async (query, sort = { access_date: -1 }, populate = [], select = '') => {
    return await ContactAccessLog.find(query)
        .populate(populate)
        .select(select)
        .sort(sort)
        .lean();
};

/**
 * Get a contact access log by id
 */
exports.getContactAccessLogById = async (id, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'Contact Access Log ID');

    const contactAccessLog = await ContactAccessLog.findById(id)
        .populate(populate)
        .select(select)
        .lean();

    if (!contactAccessLog) {
        throw new ErrorResponse(`Contact access log not found with id of ${id}`, 404);
    }

    return contactAccessLog;
};

/**
 * Create a contact access log entry
 */
exports.createContactAccessLog = async (data) => {
    try {
        const contactAccessLog = await ContactAccessLog.create(data);
        return contactAccessLog;
    } catch (error) {
        // Log the error but don't throw to prevent breaking the main operation
        console.error('Error creating contact access log:', error);
        return null;
    }
};

/**
 * Log contact login
 */
exports.logContactLogin = async (contactId, ipAddress) => {
    Validators.checkValidateObjectId(contactId, 'Contact ID');

    return await this.createContactAccessLog({
        contact: contactId,
        operation: PORTAL_OPERATIONS.LOGIN,
        access_date: Date.now(),
        ip_address: ipAddress
    });
};

/**
 * Log contact logout
 */
exports.logContactLogout = async (contactId, ipAddress) => {
    Validators.checkValidateObjectId(contactId, 'Contact ID');

    return await this.createContactAccessLog({
        contact: contactId,
        operation: PORTAL_OPERATIONS.LOGOUT,
        access_date: Date.now(),
        ip_address: ipAddress
    });
};

/**
 * Log contact session timeout
 */
exports.logContactSessionTimeout = async (contactId, ipAddress) => {
    Validators.checkValidateObjectId(contactId, 'Contact ID');

    return await this.createContactAccessLog({
        contact: contactId,
        operation: PORTAL_OPERATIONS.SESSION_TIMEOUT,
        access_date: Date.now(),
        ip_address: ipAddress
    });
};

/**
 * Get contact access logs by contact ID
 */
exports.getContactAccessLogsByContactId = async (contactId, page = 1, limit = 10, sort = { access_date: -1 }, populate = [], select = '') => {
    Validators.checkValidateObjectId(contactId, 'Contact ID');

    const query = { contact: contactId };
    return await this.getContactAccessLogs(query, page, limit, sort, populate, select);
};

/**
 * Get contact access logs by operation type
 */
exports.getContactAccessLogsByOperation = async (operation, page = 1, limit = 10, sort = { access_date: -1 }, populate = [], select = '') => {
    if (!Object.values(PORTAL_OPERATIONS).includes(operation)) {
        throw new ErrorResponse(`Invalid operation: ${operation}`, 400);
    }

    const query = { operation };
    return await this.getContactAccessLogs(query, page, limit, sort, populate, select);
};

/**
 * Get contact access logs within a date range
 */
exports.getContactAccessLogsByDateRange = async (startDate, endDate, page = 1, limit = 10, sort = { access_date: -1 }, populate = [], select = '') => {
    const query = {
        access_date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        }
    };
    
    return await this.getContactAccessLogs(query, page, limit, sort, populate, select);
};

/**
 * Get recent contact activity (last login/logout for each contact)
 */
exports.getRecentContactActivity = async (limit = 50, populate = ['contact']) => {
    return await ContactAccessLog.aggregate([
        {
            $sort: { access_date: -1 }
        },
        {
            $group: {
                _id: '$contact',
                lastActivity: { $first: '$$ROOT' }
            }
        },
        {
            $replaceRoot: { newRoot: '$lastActivity' }
        },
        {
            $sort: { access_date: -1 }
        },
        {
            $limit: limit
        },
        ...(populate.includes('contact') ? [
            {
                $lookup: {
                    from: 'contacts',
                    localField: 'contact',
                    foreignField: '_id',
                    as: 'contact'
                }
            },
            {
                $unwind: '$contact'
            }
        ] : [])
    ]);
};

/**
 * Get contact login statistics
 */
exports.getContactLoginStats = async (contactId, days = 30) => {
    Validators.checkValidateObjectId(contactId, 'Contact ID');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await ContactAccessLog.aggregate([
        {
            $match: {
                contact: new mongoose.Types.ObjectId(contactId),
                operation: PORTAL_OPERATIONS.LOGIN,
                access_date: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: {
                    $dateToString: {
                        format: '%Y-%m-%d',
                        date: '$access_date'
                    }
                },
                count: { $sum: 1 }
            }
        },
        {
            $sort: { '_id': 1 }
        }
    ]);

    return stats;
};

/**
 * Delete old contact access logs (cleanup)
 */
exports.deleteOldContactAccessLogs = async (daysToKeep = 365) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await ContactAccessLog.deleteMany({
        access_date: { $lt: cutoffDate }
    });

    return result;
}; 