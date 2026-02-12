const BookkeeperFunder = require('../models/BookkeeperFunder');

/**
 * Get all funders associated with a bookkeeper
 * @param {string} bookkeeperId - The ID of the bookkeeper
 * @returns {Promise<Array>} - An array of funders
 */
exports.getFundersByBookkeeperId = async (bookkeeperId) => {
    // Get an array of funders (array of ids) associated with the bookkeeper
    const funders = await BookkeeperFunder.find({ bookkeeper: bookkeeperId });
    return funders.map(funder => funder.funder);
};