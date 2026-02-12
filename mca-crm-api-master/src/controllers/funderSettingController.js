const Joi = require('joi');

const FunderSettingService = require('../services/funderSettingService');

const { accessControl } = require('../middleware/auth');
const ErrorResponse = require('../utils/errorResponse');
const Helpers = require('../utils/helpers');

/**
 * Validate mask format according to the specified rules
 * @param {string} mask - The mask to validate
 * @returns {boolean} - True if valid, throws ErrorResponse if invalid
 * @throws {ErrorResponse} - If mask format is invalid
 */
function validateMaskFormat(mask) {
    if (!mask || typeof mask !== 'string') {
        throw new ErrorResponse('Mask must be a non-empty string', 400);
    }

    // Split by dashes
    const parts = mask.split('-');
    
    // Must have at least 2 parts (first part + last part)
    if (parts.length < 2) {
        throw new ErrorResponse('Mask must contain at least two parts separated by dashes', 400);
    }

    // First part must not be empty and must not contain date placeholders
    const firstPart = parts[0];
    if (!firstPart || firstPart.trim() === '') {
        throw new ErrorResponse('First part of mask cannot be empty', 400);
    }
    
    const datePlaceholders = ['YYYY', 'YY', 'MM', 'DD', 'MMM', 'MMMM'];
    const hasDateInFirstPart = datePlaceholders.some(placeholder => firstPart.includes(placeholder));
    if (hasDateInFirstPart) {
        throw new ErrorResponse('First part of mask cannot contain date placeholders (YYYY, YY, MM, DD, MMM, MMMM)', 400);
    }

    // Last part must contain only # symbols
    const lastPart = parts[parts.length - 1];
    if (!lastPart || lastPart.trim() === '') {
        throw new ErrorResponse('Last part of mask cannot be empty', 400);
    }
    
    if (!/^#+$/.test(lastPart)) {
        throw new ErrorResponse('Last part of mask must contain only # symbols for sequence numbering', 400);
    }

    // Middle parts (if any) can contain date placeholders but must not be empty
    for (let i = 1; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!part || part.trim() === '') {
            throw new ErrorResponse(`Part ${i + 1} of mask cannot be empty`, 400);
        }
        
        // Check if middle parts contain only valid date placeholders and other characters
        const validDatePattern = /^(YYYY|YY|MM|DD|MMM|MMMM|[^#])*$/;
        if (!validDatePattern.test(part)) {
            throw new ErrorResponse(`Part ${i + 1} contains invalid characters. Only date placeholders (YYYY, YY, MM, DD, MMM, MMMM) and non-# characters are allowed`, 400);
        }
    }

    return true;
}

/**
 * Generate regex pattern for finding existing sequence IDs
 * @param {string} mask - The mask pattern
 * @param {number} sequenceLength - The length of the sequence number
 * @returns {RegExp} - The regex pattern
 */
function generateSequenceRegex(mask, sequenceLength) {
    // Split by dashes
    const parts = mask.split('-');
    
    // Last part must contain the sequence number (# symbols)
    const lastPart = parts[parts.length - 1];
    if (!/^#+$/.test(lastPart)) {
        throw new Error('Last part of mask must contain only # symbols for sequence numbering');
    }
    
    // Create regex pattern that matches any date in middle parts
    const processedParts = parts.map((part, index) => {
        if (index === 0) {
            // First part - no date replacement, escape special characters
            return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        } else if (index === parts.length - 1) {
            // Last part - replace # with regex pattern for sequence
            // Match numbers without leading zeros (for natural sequence) or exactly sequenceLength digits (for zero-padded)
            return `(0|[1-9]\\d{0,${sequenceLength - 1}}|\\d{${sequenceLength}})`;
        } else {
            // Middle parts - create patterns for date placeholders
            let pattern = part;
            
            // Replace date placeholders with regex patterns
            // Note: Order matters - replace longer patterns first
            pattern = pattern.replace(/YYYY/g, '\\d{4}'); // 4 digits for year
            pattern = pattern.replace(/MMMM/g, '(January|February|March|April|May|June|July|August|September|October|November|December)'); // full month names
            pattern = pattern.replace(/MMM/g, '(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)'); // 3-letter month abbreviations
            pattern = pattern.replace(/YY/g, '\\d{2}'); // 2 digits for year
            pattern = pattern.replace(/MM/g, '\\d{2}'); // 2 digits for month (01-12)
            pattern = pattern.replace(/DD/g, '\\d{2}'); // 2 digits for day (01-31)
            
            return pattern;
        }
    });

    // Join parts with dashes
    const pattern = processedParts.join('-');
    
    return new RegExp(`^${pattern}$`);
}

// Default populate configuration
const default_populate = [
    { path: 'funder', select: 'name email phone' }
];

// Query schema for funder setting filtering and validation
const query_schema = {
    sort: Joi.string().allow('').optional(),
    search: Joi.string().allow('').optional(),
    select: Joi.string().allow('').optional(),
    funder: Joi.string().allow('').optional(),
    app_seq_id_mask: Joi.string().allow('').optional(),
    funding_seq_id_mask: Joi.string().allow('').optional(),
    created_date_from: Joi.date().allow('').optional(),
    created_date_to: Joi.date().allow('').optional(),
    updated_date_from: Joi.date().allow('').optional(),
    updated_date_to: Joi.date().allow('').optional()
};

// Build database query from request parameters
const buildDbQuery = (req, query) => {
    const dbQuery = {};
    dbQuery.$and = [];

    // Handle funder filter (with permission checks)
    const funderFilter = Helpers.buildFunderFilter(req, query.funder);
    if (funderFilter) {
        dbQuery.$and.push({ funder: funderFilter });
    }

    // Handle search across multiple fields
    if (query.search) {
        dbQuery.$and.push({
            $or: [
                { app_seq_id_mask: { $regex: query.search, $options: 'i' } },
                { funding_seq_id_mask: { $regex: query.search, $options: 'i' } },
                { 'funder.name': { $regex: query.search, $options: 'i' } },
                { 'funder.email': { $regex: query.search, $options: 'i' } },
                { 'funder.phone': { $regex: query.search, $options: 'i' } }
            ]
        });
    }

    // Handle specific mask filters
    if (query.app_seq_id_mask) {
        dbQuery.$and.push({ app_seq_id_mask: { $regex: query.app_seq_id_mask, $options: 'i' } });
    }
    if (query.funding_seq_id_mask) {
        dbQuery.$and.push({ funding_seq_id_mask: { $regex: query.funding_seq_id_mask, $options: 'i' } });
    }

    // Handle date range filters
    if (query.created_date_from) {
        dbQuery.$and.push({ createdAt: { $gte: query.created_date_from } });
    }
    if (query.created_date_to) {
        const created_date_to = new Date(query.created_date_to);
        created_date_to.setDate(created_date_to.getDate() + 1);
        dbQuery.$and.push({ createdAt: { $lt: created_date_to } });
    }

    if (query.updated_date_from) {
        dbQuery.$and.push({ updatedAt: { $gte: query.updated_date_from } });
    }
    if (query.updated_date_to) {
        const updated_date_to = new Date(query.updated_date_to);
        updated_date_to.setDate(updated_date_to.getDate() + 1);
        dbQuery.$and.push({ updatedAt: { $lt: updated_date_to } });
    }

    // Clean up empty $and array
    if (dbQuery.$and.length === 0) {
        delete dbQuery.$and;
    }

    return dbQuery;
};

// @desc    Get all funder settings
// @route   GET /api/v1/funder-settings
// @access  Funder-ADMIN Funder-User Bookkeeper Admin
exports.getFunderSettings = async (req, res, next) => {
    try {
        const schema = Joi.object({
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).max(100).default(25),
            ...query_schema
        });

        const { value, error } = schema.validate(req.query);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { page, limit, sort, select, ...query } = value;

        // Build database query from validated parameters
        const dbQuery = buildDbQuery(req, query);

        // Handle sorting with default fallback
        const dbSort = Helpers.buildSort(sort, { createdAt: -1 });

        const result = await FunderSettingService.getFunderSettings(
            dbQuery,
            dbSort,
            page,
            limit,
            default_populate,
            select
        );

        res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Create a new funder setting
// @route   POST /api/v1/funder-settings
// @access  Funder-ADMIN Admin
exports.createFunderSetting = async (req, res, next) => {
    try {
        const schema = Joi.object({
            funder: Joi.string().optional(),
            app_seq_id_mask: Joi.string().optional(),
            funding_seq_id_mask: Joi.string().optional()
        });

        const { value, error } = schema.validate(req.body);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        // Validate mask format requirements
        if (value.app_seq_id_mask) {
            try {
                validateMaskFormat(value.app_seq_id_mask);
            } catch (error) {
                return next(new ErrorResponse(`app_seq_id_mask: ${error.message}`, 400));
            }
        }
        if (value.funding_seq_id_mask) {
            try {
                validateMaskFormat(value.funding_seq_id_mask);
            } catch (error) {
                return next(new ErrorResponse(`funding_seq_id_mask: ${error.message}`, 400));
            }
        }

        // Determine funder ID to use
        let funderId = value.funder;
        if (!funderId) {
            if (req.filter?.funder) {
                funderId = req.filter.funder;
            } else {
                return next(new ErrorResponse('Funder ID is required', 400));
            }
        }

        // Check user permissions for this funder using funderFilter
        const funderFilter = Helpers.buildFunderFilter(req, funderId);
        if (funderFilter) {
            if (typeof funderFilter === 'object' && funderFilter.$in) {
                if (!funderFilter.$in.includes(funderId)) {
                    return next(new ErrorResponse('You don\'t have permission to create funder setting for this funder', 403));
                }
            } else if (funderFilter !== funderId) {
                return next(new ErrorResponse('You don\'t have permission to create funder setting for this funder', 403));
            }
        }

        const funderSetting = await FunderSettingService.createFunderSetting({ ...value, funder: funderId }, default_populate);

        res.status(201).json({
            success: true,
            data: funderSetting
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Get funder settings without pagination
// @route   GET /api/v1/funder-settings/list
// @access  Funder-ADMIN Admin
exports.getFunderSettingsList = async (req, res, next) => {
    try {
        const schema = Joi.object({
            ...query_schema
        });

        const { value, error } = schema.validate(req.query);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { sort, select, ...query } = value;

        // Build database query from validated parameters
        const dbQuery = buildDbQuery(req, query);

        // Handle sorting with default fallback
        const dbSort = Helpers.buildSort(sort, { createdAt: 1 });

        const funderSettings = await FunderSettingService.getFunderSettingsList(dbQuery, dbSort, default_populate, select);

        res.status(200).json({
            success: true,
            data: funderSettings
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Generate sequence ID based on selected mask field (auto-creates default funder setting if not exists)
// @route   GET /api/v1/funder-settings/generate-sequence-id?select=app_seq_id_mask|funding_seq_id_mask
// @access  Funder-ADMIN Funder-User Bookkeeper Admin
exports.generateSequenceId = async (req, res, next) => {
    try {
        const schema = Joi.object({
            select: Joi.string().required().valid('app_seq_id_mask', 'funding_seq_id_mask'),
            funder: Joi.string().optional()
        });

        const { value, error } = schema.validate(req.query);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { select, funder } = value;

        // Determine funder ID to use
        let funderId = funder;
        if (!funderId) {
            if (req.filter?.funder) {
                funderId = req.filter.funder;
            } else {
                return next(new ErrorResponse('Funder ID is required', 400));
            }
        }

        // Build funder filter with permissions check
        const funderFilter = Helpers.buildFunderFilter(req, funderId);
        if (funderFilter) {
            if (typeof funderFilter === 'object' && funderFilter.$in) {
                if (!funderFilter.$in.includes(funderId)) {
                    return next(new ErrorResponse('You don\'t have permission to access this funder', 403));
            }
            } else if (funderFilter !== funderId) {
                return next(new ErrorResponse('You don\'t have permission to access this funder', 403));
            }
        }

        // Get or create funder setting
        let funderSetting;
        let isNewlyCreated = false;
        try {
            funderSetting = await FunderSettingService.getFunderSettingByFunderId(funderId);
        } catch (error) {
            // If funder setting not found, create a default one
            if (error.statusCode === 404) {
                try {
                    // Create default funder setting with standard masks
                    const defaultFunderSettingData = {
                        funder: funderId
                    };
                    funderSetting = await FunderSettingService.createFunderSetting(defaultFunderSettingData);
                    isNewlyCreated = true;
                } catch (createError) {
                    return next(new ErrorResponse('Failed to create default funder setting', 500));
                }
            } else {
                return next(error);
            }
        }

        // Get the appropriate mask based on select field
        const mask = funderSetting[select];
        if (!mask) {
            return next(new ErrorResponse(`${select} is not configured for this funder`, 400));
        }

        // Generate the sequence ID
        const sequenceId = await generateSequenceIdFromMask(mask, select, funderId);

        res.status(200).json({
            success: true,
            data: {
                sequence_id: sequenceId
            }
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Update funder setting
// @route   PUT /api/v1/funder-settings/:id
// @access  Funder-ADMIN Admin
exports.updateFunderSetting = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            app_seq_id_mask: Joi.string().optional(),
            funding_seq_id_mask: Joi.string().optional()
        });

        const { value, error } = schema.validate({ ...req.params, ...req.body });

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        // Validate mask format requirements
        if (value.app_seq_id_mask) {
            try {
                validateMaskFormat(value.app_seq_id_mask);
            } catch (error) {
                return next(new ErrorResponse(`app_seq_id_mask: ${error.message}`, 400));
            }
        }
        if (value.funding_seq_id_mask) {
            try {
                validateMaskFormat(value.funding_seq_id_mask);
            } catch (error) {
                return next(new ErrorResponse(`funding_seq_id_mask: ${error.message}`, 400));
            }
        }

        const { id, ...data } = value;

        // Check permissions
        const funderSetting = await FunderSettingService.getFunderSettingById(id);
        accessControl(req, funderSetting, 'funder setting');

        const updatedFunderSetting = await FunderSettingService.updateFunderSetting(id, data, default_populate);

        res.status(200).json({
            success: true,
            data: updatedFunderSetting
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Get funder setting by id
// @route   GET /api/v1/funder-settings/:id
// @access  Funder-ADMIN Funder-User Bookkeeper Admin
exports.getFunderSettingById = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const funderSetting = await FunderSettingService.getFunderSettingById(value.id, default_populate);
        accessControl(req, funderSetting, 'funder setting');

        res.status(200).json({
            success: true,
            data: funderSetting
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Generate sequence ID from mask pattern
 * @param {string} mask - The mask pattern (e.g., 'APP-####-MMDDYY') - must follow the specified format
 * @param {string} select - The select field ('app_seq_id_mask' or 'funding_seq_id_mask')
 * @param {string} funderId - The funder ID
 * @returns {string} - The generated sequence ID
 * @throws {ErrorResponse} - If mask format is invalid
 */
async function generateSequenceIdFromMask(mask, select, funderId) {
    // Validate mask format
    validateMaskFormat(mask);

    // Split mask by dashes
    const parts = mask.split('-');
    const sequenceLength = parts[parts.length - 1].length; // Length of the # part

    // Generate regex pattern for finding existing sequence IDs
    const searchRegex = generateSequenceRegex(mask, sequenceLength);

    const maxSequence = await FunderSettingService.getMaxSequenceNumber(select, funderId, searchRegex);

    // Generate next sequence number
    const nextSequence = maxSequence + 1;

    // Pad the sequence number with leading zeros to match mask length
    // If sequence exceeds mask length (e.g., 1000 for ###), show full number
    // If sequence is shorter (e.g., 88 for ###), pad with zeros (088)
    const paddedSequence = String(nextSequence).padStart(sequenceLength, '0');

    // Generate the final sequence ID by replacing date placeholders and sequence
    const now = new Date();
    const monthNames = {
        short: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        full: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    };

    // Process each part according to the rules
    const processedParts = parts.map((part, index) => {
        if (index === 0) {
            // First part - no date replacement
            return part;
        } else if (index === parts.length - 1) {
            // Last part - replace # with sequence number
            return paddedSequence;
        } else {
            // Middle parts - replace date placeholders
            return part
                .replace(/YYYY/g, now.getFullYear().toString())
                .replace(/YY/g, now.getFullYear().toString().slice(2))
                .replace(/MMMM/g, monthNames.full[now.getMonth()])
                .replace(/MMM/g, monthNames.short[now.getMonth()])
                .replace(/MM/g, String(now.getMonth() + 1).padStart(2, '0'))
                .replace(/DD/g, String(now.getDate()).padStart(2, '0'));
        }
    });

    // Join parts with dashes to create the final sequence ID
    return processedParts.join('-');
}
