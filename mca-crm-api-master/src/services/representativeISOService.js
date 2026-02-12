const RepresentativeISO = require('../models/RepresentativeISO');

const ErrorResponse = require('../utils/errorResponse');
const Validators = require('../utils/validators');

/**
 * Get all ISOs associated with a representative
 * @param {string} representativeId - The ID of the representative
 * @returns {Promise<Array>} - An array of ISOs
 */
exports.getISOsByRepresentativeId = async (representativeId) => {
    const isos = await RepresentativeISO.find({ representative: representativeId });

    // Extract ISO IDs and remove duplicates using Set
    const uniqueISOs = [...new Set(isos.map(iso => iso.iso.toString()))];

    return uniqueISOs;
};

/**
 * Get all ISOs associated with a list of representatives
 * @param {Array} representativeIds - An array of representative IDs
 * @returns {Promise<Array>} - An array of ISOs
 */
exports.getISOsByRepresentativeIds = async (representativeIds) => {
    const isos = await RepresentativeISO.find({ representative: { $in: representativeIds } });

    // Extract ISO IDs and remove duplicates using Set
    const uniqueISOs = [...new Set(isos.map(iso => iso.iso.toString()))];

    return uniqueISOs;
};

/**
 * Get all representatives associated with an ISO
 * @param {string} isoId - The ID of the ISO
 * @returns {Promise<Array>} - An array of representatives
 */
exports.getRepresentativesByISOId = async (isoId) => {
    const representatives = await RepresentativeISO.find({ iso: isoId });

    // Extract representative IDs and remove duplicates using Set
    const uniqueRepresentatives = [...new Set(representatives.map(representative => representative.representative.toString()))];

    return uniqueRepresentatives;
};

/**
 * Get all representatives associated with a list of ISOs
 * @param {Array} isoIds - An array of ISO IDs
 * @returns {Promise<Array>} - An array of representatives
 */
exports.getRepresentativesByISOIds = async (isoIds) => {
    const representatives = await RepresentativeISO.find({ iso: { $in: isoIds } });

    // Extract representative IDs and remove duplicates using Set
    const uniqueRepresentatives = [...new Set(representatives.map(representative => representative.representative.toString()))];

    return uniqueRepresentatives;
};


/**
 * Create a new representative-ISO
 * @param {Object} representativeISOData - The data of the representative-ISO
 * @returns {Promise<Object>} - The created representative-ISO
 */
exports.createRepresentativeISO = async (representative, iso) => {
    // Check if the representative-ISO is already in the database
    let representativeISO = await RepresentativeISO.findOne({ representative, iso });

    if (!representativeISO) {
        representativeISO = await RepresentativeISO.create({ representative, iso });
    }

    return representativeISO;
};

/**
 * Get representative-ISO by ID
 * @param {string} id - The ID of the representative-ISO
 * @param {Array} populate - The fields to populate
 * @param {string} select - The fields to select
 * @returns {Promise<Object>} - The representative-ISO
 */
exports.getRepresentativeISOById = async (id, populate = [], select = '') => {
    Validators.checkValidateObjectId(id, 'representative-ISO ID');

    const representativeISO = await RepresentativeISO
        .findById(id)
        .populate(populate)
        .select(select)
        .lean();

    if (!representativeISO) {
        throw new ErrorResponse(`Representative-ISO not found with id of ${id}`, 404);
    }

    return representativeISO;
};

/**
 * get all representative-ISO
 * @param {Object} query - The query of the representative-ISO
 * @param {number} page - The page of the user-funder
 * @param {number} limit - The limit of the representative-ISO
 * @param {Object} sort - The sort of the representative-ISO
 * @returns {Promise<Object>} - The representative-ISO
 */
exports.getRepresentativeISOs = async (query, page = 1, limit = 10, sort = {}, populate = []) => {
    const skip = (page - 1) * limit;
    const [representativeISO, count] = await Promise.all([
        RepresentativeISO.find(query)
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .populate(populate)
            .lean(),
        RepresentativeISO.countDocuments(query)
    ]);
    return {
        docs: representativeISO,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalResults: count
        }
    };
};

/**
 * Get a list of representative-ISO without pagination
 * @param {Object} query - The query of the representative-ISO
 * @param {Array} populate - The fields to populate
 * @param {string} select - The fields to select
 * @returns {Promise<Array>} - The representative-ISO
 */
exports.getRepresentativeISOsList = async (query, populate = [], select = '', sort = {}) => {
    return await RepresentativeISO.find(query)
        .populate(populate)
        .select(select)
        .sort(sort)
        .lean();
};

/**
 * Update a representative's ISO list
 * @param {string} representative - The ID of the representative
 * @param {Array} isoList - The list of ISO IDs
 * @returns {Promise<boolean>} - The updated representative-ISO
 */
exports.updateRepresentativeISOList = async (representative, isoList) => {
    await RepresentativeISO.deleteMany({ representative });
    await Promise.all(isoList.map(iso => RepresentativeISO.create({ representative, iso })));
};

/**
 * Update an ISO's representative list
 * @param {string} iso - The ID of the ISO
 * @param {Array} representativeList - The list of representative IDs
 * @returns {Promise<boolean>} - The updated ISO-representative
 */
exports.updateISORepresentativeList = async (iso, representativeList) => {
    await RepresentativeISO.deleteMany({ iso });
    await Promise.all(representativeList.map(representative => RepresentativeISO.create({ iso, representative })));
};

/**
 * Delete a representative-ISO
 * @param {string} representative - The ID of the representative
 * @param {string} iso - The ID of the ISO
 * @returns {Promise<boolean>} - The deleted representative-ISO
 */
exports.deleteRepresentativeISO = async (representative, iso) => {
    Validators.checkValidateObjectId(representative, 'representative ID');
    Validators.checkValidateObjectId(iso, 'iso ID');

    return await RepresentativeISO.deleteMany({ representative, iso });
};
