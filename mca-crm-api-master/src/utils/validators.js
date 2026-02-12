const mongoose = require('mongoose');
const ErrorResponse = require('./errorResponse');


// @todo These fuctions are not allowed to call each other or repeat the same verification, otherwise, there may be repeated verification. 
/**
 * Check whether a Mongo ObjectId is valid
 * @param {string} id - The ObjectId to validate
 * @param {string} [name='ID'] - The name of the field (for error message)
 */
exports.checkValidateObjectId = (id, name = 'ID') => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ErrorResponse(`Invalid ${name} format`, 400);
    }
    return this;
};

/**
 * if resource is not found, throw an error of 404
 */
exports.checkResourceNotFound = (resource, name = 'Resource') => {
    if (!resource) {
        throw new ErrorResponse(`${name} not found`, 404);
    }
    return this;
};

/**
 * Check resource whether it is be created, throw an error of 500
 */
exports.checkResourceCreated = (resource, name = 'Resource') => {
    if (!resource) {
        throw new ErrorResponse(`Failed to create ${name}`, 500);
    }
    return this;
};

/**
 * Check resource whether has been created, throw an error of 400
 */
exports.ensureResourceNotExists = (resource, name = 'Resource') => {
    if (resource) {
        throw new ErrorResponse(`${name} already exists`, 400);
    }
    return this;
};