const mongoose = require('mongoose');
const Helpers = require('../../utils/helpers');
const ErrorResponse = require('../../utils/errorResponse');

const formatDataBeforeReturn = (data) => {
    if (data && data.available_balance !== undefined) {
        data.available_balance = Helpers.centsToDollars(data.available_balance);
    }
    return data;
};

/**
 * Generic method to transfer available balance between any two models that have available_balance field
 * @param {string} sourceModal - The source model name (e.g., 'Syndicator-Funder', 'Funder-Account')
 * @param {string} sourceId - The source document ID
 * @param {string} targetModal - The target model name (e.g., 'Syndicator-Funder', 'Funder-Account')
 * @param {string} targetId - The target document ID
 * @param {number} amount - The amount to transfer in dollars (will be converted to cents for storage)
 * @param {Object} session - MongoDB session for transaction support
 * @returns {Promise<Object>} - The transfer result with source and target documents
 */
exports.transferAvailableBalance = async (sourceModal, sourceId, targetModal, targetId, amount, session = null) => {
    try {
        // Validate inputs
        if (!sourceModal || !sourceId || !targetModal || !targetId) {
            throw new ErrorResponse('Source modal, source ID, target modal, and target ID are required', 400);
        }
        
        if (typeof amount !== 'number' || amount === 0) {
            throw new ErrorResponse('Amount must be a non-zero number', 400);
        }

        // Get the models dynamically
        const SourceModel = mongoose.model(sourceModal);
        const TargetModel = mongoose.model(targetModal);

        // Validate that both models exist and have available_balance field
        if (!SourceModel || !TargetModel) {
            throw new ErrorResponse(`One or both models not found: ${sourceModal}, ${targetModal}`, 404);
        }

        // Check if models have available_balance field by looking at their schemas
        const sourceSchema = SourceModel.schema;
        const targetSchema = TargetModel.schema;
        
        if (!sourceSchema.paths.available_balance || !targetSchema.paths.available_balance) {
            throw new ErrorResponse(`One or both models do not have available_balance field: ${sourceModal}, ${targetModal}`, 400);
        }

        // Get source and target documents
        const [sourceDoc, targetDoc] = await Promise.all([
            SourceModel.findById(sourceId).session(session),
            TargetModel.findById(targetId).session(session)
        ]);

        if (!sourceDoc) {
            throw new ErrorResponse(`Source document not found: ${sourceModal} with ID ${sourceId}`, 404);
        }
        
        if (!targetDoc) {
            throw new ErrorResponse(`Target document not found: ${targetModal} with ID ${targetId}`, 404);
        }

        // Convert amount from dollars to cents for storage
        const amountInCents = Helpers.dollarsToCents(amount);
        
        // Check if source has sufficient balance (compare in cents)
        if (sourceDoc.available_balance < amountInCents) {
            // Convert back to dollars for error message
            const availableInDollars = Helpers.centsToDollars(sourceDoc.available_balance);
            throw new ErrorResponse(`Insufficient balance in source ${sourceModal}. Available: $${availableInDollars}, Requested: $${amount}`, 400);
        }

        // Update both documents atomically (using cents)
        const [updatedSource, updatedTarget] = await Promise.all([
            SourceModel.findByIdAndUpdate(
                sourceId,
                { $inc: { available_balance: -amountInCents } },
                { 
                    new: true, 
                    runValidators: true,
                    session: session 
                }
            ).lean(),
            
            TargetModel.findByIdAndUpdate(
                targetId,
                { $inc: { available_balance: amountInCents } },
                { 
                    new: true, 
                    runValidators: true,
                    session: session 
                }
            ).lean()
        ]);

        if (!updatedSource || !updatedTarget) {
            throw new ErrorResponse('Failed to update one or both documents', 500);
        }

        return {
            source: formatDataBeforeReturn(updatedSource),
            target: formatDataBeforeReturn(updatedTarget)
        };

    } catch (error) {
        throw new ErrorResponse(error.message, 500);
    }
};