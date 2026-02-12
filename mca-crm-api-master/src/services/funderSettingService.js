const FunderSetting = require('../models/FunderSetting');
const Application = require('../models/Application');
const Funding = require('../models/Funding');
const mongoose = require('mongoose');

const ErrorResponse = require('../utils/errorResponse');
const Validators = require('../utils/validators');

/**
 * Create a new funder setting
 */
exports.createFunderSetting = async (data, populate = [], select = '') => {
    const funderSetting = await FunderSetting.create(data);

    if (!funderSetting) {
        throw new ErrorResponse('Failed to create funder setting', 500);
    }
    
    return this.getFunderSettingById(funderSetting._id, populate, select);
};

/**
 * Get a funder setting by ID
 */
exports.getFunderSettingById = async (id, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'funder setting ID');
    const funderSetting = await FunderSetting.findById(id)
        .populate(populate)
        .select(select)
        .lean();
    if (!funderSetting) {
        throw new ErrorResponse('Funder setting not found', 404);
    }
    return funderSetting;
};

/**
 * Get all funder settings
 */
exports.getFunderSettings = async (query, sort = { createdAt: -1 }, page = 1, limit = 10, populate = [], select = '') => {
    const skip = (page - 1) * limit;
    const [funderSettings, count] = await Promise.all([
        FunderSetting.find(query)
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .populate(populate)
            .select(select)
            .lean(),
        FunderSetting.countDocuments(query)
    ]);
    return {
        docs: funderSettings,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalResults: count
        }
    };
};

/**
 * Get List of Funder Settings
 */
exports.getFunderSettingsList = async (query, sort = { createdAt: 1 }, populate = [], select = '') => {
    return await FunderSetting.find(query)
        .select(select)
        .sort(sort)
        .populate(populate)
        .lean();
};

/**
 * Update a funder setting
 */
exports.updateFunderSetting = async (id, data, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'funder setting ID');
    
    const funderSetting = await FunderSetting.findByIdAndUpdate(id, data, { new: true, runValidators: true });

    if (!funderSetting) {
        throw new ErrorResponse('Funder setting not found', 404);
    }

    return await this.getFunderSettingById(funderSetting._id, populate, select);
};

/**
 * Get a funder setting by funder ID
 */
exports.getFunderSettingByFunderId = async (funderId, populate = [], select = '') => {
    Validators.checkValidateObjectId(funderId, 'funder ID');
    
    const funderSetting = await FunderSetting.findOne({ funder: funderId })
        .populate(populate)
        .select(select)
        .lean();
        
    if (!funderSetting) {
        throw new ErrorResponse('Funder setting not found for this funder', 404);
    }
    
    return funderSetting;
};

/**
 * Get the maximum sequence number for a given mask pattern and funder
 * @param {string} select - The select field ('app_seq_id_mask' or 'funding_seq_id_mask')
 * @param {string} funderId - The funder ID
 * @param {RegExp} regex - The regex pattern to match identifiers
 * @returns {number} - The maximum sequence number (0 if no matches found)
 */
exports.getMaxSequenceNumber = async (select, funderId, regex) => {
    if(typeof funderId === 'string') {
        funderId = new mongoose.Types.ObjectId(funderId);
    }
    let Model;
    if (select === 'app_seq_id_mask') {
        Model = Application;
    } else if (select === 'funding_seq_id_mask') {
        Model = Funding;
    } else {
        throw new Error(`Invalid select field: ${select}`);
    }
    
    try {
        const pipeline = [
            {
                $match: {
                    'funder.id': funderId,
                    'identifier': { $exists: true, $ne: null, $regex: regex }
                }
            },
            {
                $addFields: {
                    numericPart: {
                        $toInt: {
                            $arrayElemAt: [{ $split: ["$identifier", "-"] }, -1]
                        }
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    maxSequence: { $max: "$numericPart" }
                }
            }
        ];

        const result = await Model.aggregate(pipeline).allowDiskUse(false).exec();
        
        return result.length > 0 && result[0].maxSequence ? result[0].maxSequence : 0;
        
    } catch (error) {
        console.error(`Error getting max sequence number for ${select}:`, error);
        return 0;
    }
};


