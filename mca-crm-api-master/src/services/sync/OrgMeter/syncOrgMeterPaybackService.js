const Payback = require('../../../models/Payback');
const PaybackPlan = require('../../../models/PaybackPlan');
const OrgMeterPayment = require('../../../models/OrgMeter/Payment');
const PaybackService = require('../../../services/paybackService');
const { PAYBACK_STATUS, PAYMENT_METHOD } = require('../../../utils/constants');

/**
 * Service for syncing OrgMeter payments to paybacks
 */
class SyncOrgMeterPaybackService {
    constructor(funderId, userId = null) {
        this.funderId = funderId;
        this.userId = userId;
    }

    /**
     * Create paybacks for synced funding from OrgMeter payments
     * @param {Object} orgMeterAdvance - OrgMeter advance document
     * @param {Object} funding - System funding document
     */
    async createPaybacks(orgMeterAdvance, funding) {
        try {
            // Validate required parameters
            if (!funding || !funding._id) {
                console.error(`Cannot create paybacks: funding is null or missing _id for advance ${this.getAdvanceDisplayName(orgMeterAdvance)}`);
                return;
            }

            if (!orgMeterAdvance || !orgMeterAdvance.id) {
                console.error('Cannot create paybacks: orgMeterAdvance is null or missing id');
                return;
            }

            // Find payments for this advance
            const payments = await OrgMeterPayment.find({
                advanceId: orgMeterAdvance.id,
                'importMetadata.funder': this.funderId,
                //'syncMetadata.syncId': { $eq: null },
                deleted: false,
                type: 'advance_payback'
            }).sort({ createdAt: 1 }); // Sort by creation date for chronological order

            if (payments.length === 0) {
                console.log(`No advance_payback payments found for advance: ${this.getAdvanceDisplayName(orgMeterAdvance)}`);
                return;
            }

            // Find the first payback plan for this funding
            const paybackPlan = await PaybackPlan.findOne({
                funding: funding._id
            }).sort({ createdAt: 1 }); // Get the first one created

            // Process each payment individually
            for (const payment of payments) {
                await this.createOrUpdatePayback(orgMeterAdvance, funding, payment, paybackPlan);
            }

            console.log(`Processed ${payments.length} payments for funding: ${funding._id}`);

        } catch (error) {
            console.error(`Failed to create paybacks for funding ${funding?._id || 'unknown'}:`, error.message);
            // Don't throw error to avoid breaking the sync process
        }
    }

    /**
     * Create or update a single payback from OrgMeter payment
     * @param {Object} orgMeterAdvance - OrgMeter advance document
     * @param {Object} funding - System funding document
     * @param {Object} payment - OrgMeter payment document
     * @param {Object} paybackPlan - PaybackPlan document (optional)
     */
    async createOrUpdatePayback(orgMeterAdvance, funding, payment, paybackPlan = null) {
        try {
            // Validate required parameters
            if (!funding || !funding._id) {
                console.error(`Invalid funding object for payment ${payment.id}: funding is null or missing _id`);
                return;
            }

            if (!payment || !payment.id) {
                console.error('Invalid payment object: payment is null or missing id');
                return;
            }

            let existingPayback = null;
            
            // First, check if payback already exists by syncId in payment
            if (payment.syncMetadata?.syncId) {
                existingPayback = await Payback.findById(payment.syncMetadata.syncId);
            }

            // If not found by syncId, check if payback already exists for this funding and payment
            if (!existingPayback) {
                existingPayback = await Payback.findOne({
                    funding: funding._id,
                    due_date: payment.dueAt,
                    payback_amount: payment.amount ? Math.round(parseFloat(payment.amount.toString()) * 100) : 0
                });

                // If found, update the payment's syncMetadata with the existing payback ID
                if (existingPayback) {
                    await this.updatePaymentSyncMetadata(payment, existingPayback._id);
                }
            }

            if (existingPayback) {
                // Update existing payback
                await this.updateExistingPayback(existingPayback, orgMeterAdvance, funding, payment, paybackPlan);
            } else {
                // Create new payback
                await this.createNewPayback(orgMeterAdvance, funding, payment, paybackPlan);
            }

        } catch (error) {
            console.error(`Failed to create/update payback for payment ${payment.id}:`, error.message);
        }
    }

    /**
     * Create a new payback from OrgMeter payment
     * @param {Object} orgMeterAdvance - OrgMeter advance document
     * @param {Object} funding - System funding document
     * @param {Object} payment - OrgMeter payment document
     * @param {Object} paybackPlan - PaybackPlan document (optional)
     * @returns {Object|null} Created payback document
     */
    async createNewPayback(orgMeterAdvance, funding, payment, paybackPlan = null) {
        try {
            // Transform payment to payback data
            const paybackData = await this.transformPayback(orgMeterAdvance, funding, payment, paybackPlan);
            
            if (!paybackData) {
                return null;
            }

            // Create payback
            const payback = await PaybackService.createPayback(paybackData, [], '', true);

            return payback;

        } catch (error) {
            console.error(`Failed to create new payback for payment ${payment.id}:`, error.message);
            return null;
        }
    }

    /**
     * Update an existing payback with OrgMeter payment data
     * @param {Object} existingPayback - Existing payback document
     * @param {Object} orgMeterAdvance - OrgMeter advance document
     * @param {Object} funding - System funding document
     * @param {Object} payment - OrgMeter payment document
     * @param {Object} paybackPlan - PaybackPlan document (optional)
     * @returns {Object} Updated payback document
     */
    async updateExistingPayback(existingPayback, orgMeterAdvance, funding, payment, paybackPlan = null) {
        try {
            // Transform payment to payback data
            const paybackData = await this.transformPayback(orgMeterAdvance, funding, payment, paybackPlan);
            
            if (!paybackData) {
                return existingPayback;
            }

            // Update payback
            const updatedPayback = await PaybackService.updatePayback(
                existingPayback._id,
                paybackData,
                [],
                '',
                true
            );

            return updatedPayback;

        } catch (error) {
            console.error(`Failed to update payback ${existingPayback._id} for payment ${payment.id}:`, error.message);
            return existingPayback;
        }
    }

    /**
     * Update payment's syncMetadata with payback ID
     * @param {Object} payment - OrgMeter payment document
     * @param {String} paybackId - Payback ID
     */
    async updatePaymentSyncMetadata(payment, paybackId) {
        try {
            const updateData = {
                'syncMetadata.lastSyncedAt': new Date(),
                'syncMetadata.lastSyncedBy': this.userId || 'system',
                'syncMetadata.syncId': paybackId
            };

            const result = await OrgMeterPayment.findOneAndUpdate(
                { 
                    id: payment.id,
                    'importMetadata.funder': payment.importMetadata.funder
                },
                { $set: updateData },
                { new: true }
            );

            if (result) {
                console.log(`Updated payment ${payment.id} syncMetadata with payback ID: ${paybackId}`);
            } else {
                console.log(`Warning: Payment ${payment.id} not found for syncMetadata update`);
            }

        } catch (error) {
            console.error(`Failed to update syncMetadata for payment ${payment.id}:`, error.message);
        }
    }

    /**
     * Create transaction for a single payback with status SUCCEED
     * @param {Object} payback - Payback document
     */
    async createTransactionForPayback(payback) {
        try {
            if (payback.status === 'SUCCEED' && !payback.transaction) {
                const TransactionService = require('../../../services/transactionService');
                const Helpers = require('../../../utils/helpers');
                const { TRANSACTION_TYPES, TRANSACTION_SENDER_TYPES, TRANSACTION_RECEIVER_TYPES } = require('../../../utils/constants');

                const transaction = await TransactionService.createTransaction({
                    funder: Helpers.extractIdString(payback.funder),
                    sender: Helpers.extractIdString(payback.merchant),
                    receiver: Helpers.extractIdString(payback.funder),
                    sender_type: TRANSACTION_SENDER_TYPES.MERCHANT,
                    receiver_type: TRANSACTION_RECEIVER_TYPES.FUNDER,
                    sender_account: payback.merchant_account,
                    receiver_account: payback.funder_account,
                    amount: Helpers.centsToDollars(payback.payback_amount),
                    transaction_date: payback.processed_date || Date.now(),
                    funding: Helpers.extractIdString(payback.funding),
                    type: TRANSACTION_TYPES.PAYBACK,
                    source: payback._id,
                    reconciled: payback.reconciled
                });

                // Update the payback with the transaction reference
                await Payback.updateOne(
                    { _id: payback._id },
                    { $set: { transaction: transaction._id } }
                );

                console.log(`Created transaction ${transaction._id} for payback ${payback._id}`);
            }
        } catch (error) {
            console.error(`Failed to create transaction for payback ${payback._id}:`, error.message);
        }
    }

    /**
     * Transform OrgMeter payment data to payback format
     * @param {Object} orgMeterAdvance - OrgMeter advance document
     * @param {Object} funding - System funding document
     * @param {Object} payment - OrgMeter payment document
     * @param {Object} paybackPlan - PaybackPlan document (optional)
     * @returns {Object|null} Transformed payback data
     */
    async transformPayback(orgMeterAdvance, funding, payment, paybackPlan = null) {
        try {
            // Validate required parameters
            if (!funding || !funding._id) {
                console.error(`Cannot transform payback: funding is null or missing _id for payment ${payment?.id || 'unknown'}`);
                return null;
            }

            if (!payment) {
                console.error('Cannot transform payback: payment is null');
                return null;
            }

            // Convert payment amount to cents
            const paymentAmount = payment.amount ? 
                parseFloat(payment.amount.toString()) : 0;

            // Determine status based on payment flags
            let status = PAYBACK_STATUS.SUBMITTED;
            if (payment.paid) {
                status = PAYBACK_STATUS.SUCCEED;
            } else if (payment.bounced) {
                status = PAYBACK_STATUS.BOUNCED;
            } else if (payment.ignored) {
                status = PAYBACK_STATUS.FAILED;
            }

            // Build response string
            let response = '';
            if (payment.bouncedReasonCode || payment.bouncedReason) {
                const reasonCode = payment.bouncedReasonCode ? `[${payment.bouncedReasonCode}]` : '';
                const reason = payment.bouncedReason || '';
                response = `${reasonCode} ${reason}`.trim();
            }

            // Format notes
            const formattedNotes = await this.formatPaymentNotes(payment.notes);

            // Find created by and updated by users
            const createdByUser = await this.findUserBySyncId(payment.createdBy);
            const updatedByUser = await this.findUserBySyncId(payment.updatedBy);

            // Safely extract merchant, funder, and lender IDs
            const merchantId = funding.merchant?.id || funding.merchant || null;
            const funderId = funding.funder?.id || funding.funder || null;
            const lenderId = funding.lender?.id || funding.lender || null;

            const paybackData = {
                funding: funding._id,
                merchant: merchantId,
                funder: funderId,
                lender: lenderId,
                merchant_account: null,
                funder_account: null,
                payback_plan: paybackPlan?._id || null,
                due_date: payment.dueAt || null,
                submitted_date: payment.createdAt || null,
                processed_date: payment.updatedAt || null,
                responsed_date: payment.paidAt || payment.bouncedAt || null,
                response: response,
                payback_amount: paymentAmount,
                funded_amount: paymentAmount,
                fee_amount: 0,
                payment_method: PAYMENT_METHOD.OTHER,
                ach_processor: null,
                status: status,
                note: formattedNotes,
                created_by_user: createdByUser,
                updated_by_user: updatedByUser
            };

            return paybackData;

        } catch (error) {
            console.error('Error transforming payback data:', error.message);
            return null;
        }
    }

    /**
     * Format payment notes into a single string
     * @param {Array} notes - Array of payment notes
     * @returns {String} Formatted notes string
     */
    async formatPaymentNotes(notes) {
        if (!notes || !Array.isArray(notes) || notes.length === 0) {
            return '';
        }

        const formattedNotes = [];

        for (const note of notes) {
            try {
                // Get user name for createdBy
                let userName = 'Unknown User';
                if (note.createdBy) {
                    const user = await this.findUserBySyncId(note.createdBy);
                    if (user) {
                        // Get the actual user document to get name fields
                        const User = require('../../../models/User');
                        const userDoc = await User.findById(user);
                        if (userDoc) {
                            userName = `${userDoc.first_name || ''} ${userDoc.last_name || ''}`.trim() || 'Unknown User';
                        }
                    }
                }

                // Format date to MMM dd, yyyy HH:mm am/pm
                let formattedDate = '';
                if (note.createdAt) {
                    const date = new Date(note.createdAt);
                    formattedDate = date.toLocaleString('en-US', {
                        month: 'short',
                        day: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    });
                }

                // Build note string: "UserName - NoteText (Date)"
                const noteText = note.text || '';
                const formattedNote = `${userName} - ${noteText} (${formattedDate})`;
                formattedNotes.push(formattedNote);

            } catch (error) {
                console.error('Error formatting note:', error.message);
                // Add the note text only if formatting fails
                formattedNotes.push(note.text || '');
            }
        }

        return formattedNotes.join('\n');
    }

    /**
     * Find user by OrgMeter user ID
     * @param {Number} orgMeterUserId - OrgMeter user ID
     * @returns {String|null} System user ID
     */
    async findUserBySyncId(orgMeterUserId) {
        if (!orgMeterUserId) return null;

        try {
            const orgMeterUser = await require('../../../models/OrgMeter/User').findOne({
                id: orgMeterUserId,
                'importMetadata.funder': this.funderId,
                'syncMetadata.syncId': { $exists: true }
            });

            return orgMeterUser?.syncMetadata?.syncId || null;
        } catch (error) {
            console.error(`Error finding user for OrgMeter ID ${orgMeterUserId}:`, error.message);
            return null;
        }
    }

    /**
     * Get display name for advance
     * @param {Object} orgMeterAdvance - OrgMeter advance document
     * @returns {String} Display name
     */
    getAdvanceDisplayName(orgMeterAdvance) {
        return orgMeterAdvance.idText || orgMeterAdvance.name || `Advance ${orgMeterAdvance.id}`;
    }
}

module.exports = SyncOrgMeterPaybackService; 