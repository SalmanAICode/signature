const UploadJob = require('../../../models/UploadJob');
const PayoutService = require('../../payoutService');
const { TRANSACTION_TYPES, TRANSACTION_SENDER_TYPES, TRANSACTION_RECEIVER_TYPES } = require('../../../utils/constants');

class UploadOrgMeterPaymentService {
    constructor(funderId, userId = null) {
        this.funderId = funderId;
        this.userId = userId;
    }

    /**
     * Process payment upload job
     * @param {String} jobId - Upload job ID
     */
    async processPaymentUpload(jobId) {
        let uploadJob;
        
        try {
            uploadJob = await UploadJob.findOne({ jobId });
            if (!uploadJob) {
                console.error(`Upload job ${jobId} not found`);
                return;
            }

            // Check if job should continue running
            if (uploadJob.status !== 'pending' && uploadJob.status !== 'running') {
                console.log(`Upload job ${jobId} is ${uploadJob.status}, stopping processing`);
                return;
            }

            // Mark job as started
            await uploadJob.markStarted();

            const { csvData } = uploadJob.uploadData;
            const { columnIndexes, skipFirstRow } = uploadJob.parameters;

            // Start processing from the correct index
            const startIndex = skipFirstRow ? 1 : 0;
            const totalRecords = csvData.length - startIndex;
            
            // Update job with total count
            await uploadJob.updateProgress(0, totalRecords);

            // Process each record
            let processed = 0;
            let created = 0;
            let updated = 0;
            let errors = 0;
            let skipped = 0;

            for (let i = startIndex; i < csvData.length; i++) {
                // Check if job was cancelled
                const currentJob = await UploadJob.findOne({ jobId });
                if (currentJob.status === 'cancelled') {
                    console.log(`Upload job ${jobId} was cancelled, stopping processing`);
                    return;
                }

                const row = csvData[i];
                
                try {
                    // Transform CSV row to payment data
                    const uploadPaymentData = await this.transformRowToUploadPayment(row, columnIndexes);
                    
                    if (!uploadPaymentData) {
                        skipped++;
                        console.log(`Skipped row ${i}: Invalid or insufficient data`);
                        continue;
                    }

                    // Create upload payment
                    const uploadPayment = await this.createUploadPayment(uploadPaymentData);

                    if (uploadPayment) {
                        if (uploadPayment.syncMetadata.syncId) {
                            updated++;
                            console.log(`Updated upload payment ${uploadPayment.paymentId} with sync data: transaction ${uploadPayment.syncMetadata.syncId}`);
                        } else {
                            // Create system object based on the type of upload payment
                            let systemObject = null;
                            switch (uploadPayment.type) {
                            case 'Syndicator Deposit':
                                //systemObject = await this.createSyndicatorDeposit(uploadPayment);
                                break;
                            case 'Syndicator Withdrawal':
                                //systemObject = await this.createSyndicatorWithdrawal(uploadPayment);
                                break;
                            case 'Syndication Purchase':
                                //systemObject = await this.createSyndicationPurchase(uploadPayment);
                                break;
                            case 'Syndication Payout':
                                systemObject = await this.createSyndicationPayout(uploadPayment);
                                break;
                            case 'Syndication Payout (Adjustment)':
                                //systemObject = await this.createSyndicationPayoutAdjustment(uploadPayment);
                                break;
                            case 'Syndication Payout Fee':
                                //systemObject = await this.createSyndicationPayoutFee(uploadPayment);
                                break;
                            case 'Syndication Payout Fee (Adjustment)':
                                //systemObject = await this.createSyndicationPayoutFeeAdjustment(uploadPayment);
                                break;
                            default:
                                console.warn(`Unknown payment type: ${uploadPayment.type}`);
                                break;
                            }

                            if (systemObject) {
                                await this.updateOrgMeterPaymentSyncData(uploadPayment._id, systemObject._id);
                                created++;
                                console.log(`Created system object ${systemObject._id} for payment ${uploadPayment.paymentId}`);
                            } else {
                                skipped++;
                            }
                        }
                    }

                } catch (error) {
                    errors++;
                    console.error(`Error processing row ${i}:`, error.message);
                    await uploadJob.addErrorDetail(i, error, row);
                }

                processed++;
                
                // Update progress every 10 records or at the end
                if (processed % 10 === 0 || processed === totalRecords) {
                    await uploadJob.updateProgress(processed, totalRecords, i + 1);
                }
            }

            // Mark job as completed
            await uploadJob.markCompleted({
                created,
                updated,
                errors,
                skipped,
                details: {
                    totalRecords,
                    processed,
                    summary: `Created ${created} transactions, ${errors} errors, ${skipped} skipped`
                }
            });

            console.log(`Upload job ${jobId} completed: ${created} created, ${errors} errors, ${skipped} skipped`);

        } catch (error) {
            console.error(`Upload job ${jobId} failed:`, error);
            
            if (uploadJob) {
                await uploadJob.markFailed(error);
            }
        }
    }

    /**
     * Transform CSV row data to payment object
     * @param {Array} row - CSV row data
     * @param {Object} columnIndexes - Column index mappings
     * @returns {Object|null} Upload Payment data object
     */
    async transformRowToUploadPayment(row, columnIndexes) {
        try {
            const payment = {};

            // Required fields for payments
            const requiredFields = ['paymentId', 'from', 'to', 'type', 'amount'];
            
            // Extract data based on column indexes
            for (const [field, index] of Object.entries(columnIndexes)) {
                if (index !== -1 && index < row.length) {
                    payment[field] = row[index]?.toString().trim() || '';
                }
            }

            // Validate required fields
            for (const field of requiredFields) {
                if (!payment[field]) {
                    console.warn(`Missing required field ${field} in row`);
                    return null;
                }
            }

            // Transform and validate data types
            const uploadPayment = {};

            uploadPayment.paymentId = parseInt(payment.paymentId);
            uploadPayment.advanceId = await this.getOrgMeterAdvanceId(payment.advanceId);

            uploadPayment.type = payment.type;
            
            // Parse amount - handle currency symbols, parentheses, and formatting
            let amountStr = payment.amount.toString().trim();
            
            // Check if amount is in parentheses (negative value)
            const isNegative = amountStr.includes('(') && amountStr.includes(')');
            
            // Remove currency symbols, commas, spaces, and parentheses
            amountStr = amountStr.replace(/[$,\s()]/g, '');
            
            uploadPayment.amount = parseFloat(amountStr);
            if (isNaN(uploadPayment.amount)) {
                console.warn(`Invalid amount: ${uploadPayment.amount}`);
                return null;
            }
            
            // Apply negative sign if amount was in parentheses
            if (isNegative) {
                uploadPayment.amount = -Math.abs(uploadPayment.amount);
            }

            // Parse paid date
            uploadPayment.paidDate = new Date(payment.paidDate);
            if (isNaN(uploadPayment.paidDate.getTime())) {
                console.warn(`Invalid paid date: ${uploadPayment.paidDate}`);
                return null;
            }

            // Parse due date
            uploadPayment.dueAt = new Date(payment.dueAt);
            if (isNaN(uploadPayment.dueAt.getTime())) {
                console.warn(`Invalid due date: ${uploadPayment.dueAt}`);
                return null;
            }

            // Parse paid boolean
            uploadPayment.paid = payment.paid.toLowerCase() === 'true' || payment.paid === '1' || payment.paid === 'yes';


            // Based on the type, set the from and to
            switch (uploadPayment.type) {
            case 'Syndicator Deposit':
                uploadPayment.senderId = await this.getOrgMeterSyndicatorSyncId(payment.senderId);
                uploadPayment.senderType = TRANSACTION_SENDER_TYPES.SYNDICATOR;
                uploadPayment.receiverId = this.funderId;
                uploadPayment.receiverType = TRANSACTION_RECEIVER_TYPES.FUNDER;
                break;
            case 'Syndicator Withdrawal':
                uploadPayment.senderId = this.funderId;
                uploadPayment.senderType = TRANSACTION_SENDER_TYPES.FUNDER;
                uploadPayment.receiverId = await this.getOrgMeterSyndicatorSyncId(payment.receiverId);
                uploadPayment.receiverType = TRANSACTION_RECEIVER_TYPES.SYNDICATOR;
                break;
            case 'Syndication Payout':
            case 'Syndication Payout (Adjustment)':
            case 'Syndication Payout Fee':
            case 'Syndication Payout Fee (Adjustment)':
                uploadPayment.senderId = this.funderId;
                uploadPayment.senderType = TRANSACTION_SENDER_TYPES.FUNDER;
                uploadPayment.receiverId = await this.getOrgMeterSyndicatorSyncId(payment.receiverId);
                uploadPayment.receiverType = TRANSACTION_RECEIVER_TYPES.SYNDICATOR;
                break;
            case 'Syndication Purchase':
                uploadPayment.senderId = await this.getOrgMeterSyndicatorSyncId(payment.senderId);
                uploadPayment.senderType = TRANSACTION_SENDER_TYPES.SYNDICATOR;
                uploadPayment.receiverId = this.funderId;
                uploadPayment.receiverType = TRANSACTION_RECEIVER_TYPES.FUNDER;
                break;                    
            default:
                console.warn(`Unknown payment type: ${uploadPayment.type}`);
                break;
            }

            return payment;

        } catch (error) {
            console.error('Error transforming row to payment:', error);
            return null;
        }
    }

    /**
     * Get OrgMeter syndicator sync ID
     * @param {String} syndicatorName - Syndicator name
     * @returns {String|null} OrgMeter syndicator sync ID
     */
    async getOrgMeterSyndicatorSyncId(syndicatorName) {
        const OrgMeterSyndicator = require('../../../models/OrgMeter/Syndicator');
        const syndicator = await OrgMeterSyndicator.findOne({ name: syndicatorName });
        return syndicator ? syndicator.syncMetadata?.syncId : null;
    }

    /**
     * Get OrgMeter advance id from idText
     * @param {String} idText - OrgMeter advance idText
     * @returns {String|null} OrgMeter advance id
     */
    async getOrgMeterAdvanceId(idText) {
        const OrgMeterAdvance = require('../../../models/OrgMeter/Advance');
        const advance = await OrgMeterAdvance.findOne({ idText });
        return advance ? advance.id : null;
    }

    /**
     * Create upload payment
     * @param {Object} uploadPaymentData - Upload payment data
     * @returns {Object} Created upload payment
     */
    async createUploadPayment(uploadPaymentData) {
        const UploadPayment = require('../../../models/OrgMeter/UploadPayment');

        const existingUploadPayment = await UploadPayment.findOne({ paymentId: uploadPaymentData.paymentId, 'importMetadata.funder': this.funderId });
        if (existingUploadPayment) {
            console.log(`Upload payment ${uploadPaymentData.paymentId} already exists, skipping`);
            return existingUploadPayment;
        }

        const newUploadPayment = await UploadPayment.create({
            ...uploadPaymentData,
            importMetadata: {
                funder: this.funderId,
                source: 'CSV Upload',
                importedAt: new Date(),
                importedBy: this.userId,
                lastUpdatedAt: new Date(),
                lastUpdatedBy: this.userId
            },
            syncMetadata: {
                needsSync: true,
                lastSyncedAt: null,
                lastSyncedBy: null,
                syncId: null
            }
        });

        console.log(`Created new upload payment: ${uploadPaymentData.paymentId}`);
        return newUploadPayment;
    }

    /**
     * Create system payout object
     * @param {Object} uploadPayment - Upload payment data
     * @returns {Object} Created payout
     */
    async createSyndicationPayout(uploadPayment) {
        const payoutData = {
            //payback: uploadPayment.paybackId,
            //syndication: uploadPayment.syndicationId,
            //funding: uploadPayment.fundingId,
            funder: this.funderId,
            //lender: uploadPayment.lenderId,
            //syndicator: uploadPayment.syndicatorId,
            payout_amount: uploadPayment.amount,
            fee_amount: 0,
            credit_amount: 0,
            created_date: uploadPayment.paidDate,
            created_by_user: this.userId,
            //transaction
            //redeemed_date: null,
            pending: true,
            inactive: false
        };
        
        // Create payout
        try {
            const payout = await PayoutService.createPayout(payoutData);
            return payout;
        } catch (error) {
            console.error(`Error creating syndication payout: ${error.message}`);
            return null;
        }
    }

    /**
     * Update OrgMeter payment sync metadata
     * @param {String} paymentId - OrgMeter payment ID
     * @param {String} transactionId - Created transaction ID
     */
    async updateOrgMeterPaymentSyncData(paymentId, transactionId) {
        try {
            const OrgMeterPayment = require('../../../models/OrgMeter/Payment');
            
            await OrgMeterPayment.findByIdAndUpdate(paymentId, {
                $set: {
                    'syncMetadata.syncId': transactionId,
                    'syncMetadata.lastSyncedAt': new Date(),
                    'syncMetadata.lastSyncedBy': this.userId,
                    'syncMetadata.needsSync': false
                }
            });

            console.log(`Updated OrgMeter payment ${paymentId} with sync data: transaction ${transactionId}`);

        } catch (error) {
            console.error(`Error updating OrgMeter payment sync data for ${paymentId}:`, error.message);
            throw error;
        }
    }

    /**
     * Find funding by advance ID
     * @param {String} advanceId - Advance ID from CSV
     * @returns {Object|null} Funding document
     */
    async findFundingIdByAdvanceId(advanceId) {
        try {
            const OrgMeterAdvance = require('../../../models/OrgMeter/Advance');
            const orgMeterAdvance = await OrgMeterAdvance.findOne({
                id: advanceId,
                'importMetadata.funder': this.funderId
            });

            return orgMeterAdvance?.syncMetadata?.syncId || null;
        } catch (error) {
            console.error(`Error finding funding for advance ID ${advanceId}:`, error);
            return null;
        }
    }

    /**
     * Map payment type to transaction type
     * @param {String} paymentType - Payment type from CSV
     * @returns {String} Transaction type
     */
    mapPaymentTypeToTransactionType(paymentType) {
        const typeMap = {
            'PAYBACK': TRANSACTION_TYPES.PAYBACK,
            'payback': TRANSACTION_TYPES.PAYBACK,
            'payment': TRANSACTION_TYPES.PAYBACK,
            'PAYMENT': TRANSACTION_TYPES.PAYBACK
        };

        return typeMap[paymentType] || TRANSACTION_TYPES.PAYBACK;
    }

    /**
     * Validate CSV structure and get column indexes
     * @param {Array} headers - CSV headers (first row)
     * @param {Object} fieldMappings - Field mappings from frontend
     * @returns {Object} Column indexes and validation result
     */
    static validateCsvStructure(headers, fieldMappings) {
        const requiredFields = ['paymentId', 'from', 'to', 'type', 'amount'];
        const optionalFields = ['advanceId', 'paidDate', 'dueAt', 'paid'];
        const allFields = [...requiredFields, ...optionalFields];

        const columnIndexes = {};
        const missingFields = [];

        // Find column indexes for each field
        for (const field of allFields) {
            const mappedColumn = fieldMappings[field];
            if (mappedColumn) {
                const index = headers.findIndex(header => 
                    header.toString().trim().toLowerCase() === mappedColumn.toLowerCase()
                );
                columnIndexes[field] = index;
                
                if (index === -1 && requiredFields.includes(field)) {
                    missingFields.push(field);
                }
            } else if (requiredFields.includes(field)) {
                missingFields.push(field);
                columnIndexes[field] = -1;
            } else {
                columnIndexes[field] = -1;
            }
        }

        return {
            isValid: missingFields.length === 0,
            columnIndexes,
            missingFields,
            foundFields: Object.entries(columnIndexes)
                .filter(([, index]) => index !== -1)
                .map(([fieldName]) => fieldName)
        };
    }
}

module.exports = UploadOrgMeterPaymentService; 