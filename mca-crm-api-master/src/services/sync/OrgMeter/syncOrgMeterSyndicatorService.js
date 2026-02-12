const OrgMeterSyndicator = require('../../../models/OrgMeter/Syndicator');
const Syndicator = require('../../../models/Syndicator');
const Funder = require('../../../models/Funder');
const SyndicatorFunder = require('../../../models/SyndicatorFunder');
const ErrorResponse = require('../../../utils/errorResponse');
const { SYNDICATOR_PAYOUT_FREQUENCY } = require('../../../utils/constants');

/**
 * Sync OrgMeter syndicators to system syndicators
 */
class SyncOrgMeterSyndicatorService {
    constructor(funderId, userId = null) {
        this.funderId = funderId;
        this.userId = userId;
        this.syncStats = {
            totalProcessed: 0,
            totalSynced: 0,
            totalUpdated: 0,
            totalSkipped: 0,
            totalFailed: 0,
            errors: []
        };
    }

    /**
     * Sync all selected OrgMeter syndicators to system syndicators
     * @param {Object} options - Sync options
     * @returns {Object} Sync results
     */
    async syncAllSyndicators(options = {}) {
        const {
            dryRun = false,
            updateExisting = true,
            onlySelected = true,
            progressCallback = null
        } = options;

        try {
            console.log('Starting OrgMeter syndicators sync...');
            
            // Verify funder exists
            const funder = await Funder.findById(this.funderId);
            if (!funder) {
                throw new ErrorResponse('Funder not found', 404);
            }

            // Build query for OrgMeter syndicators to sync
            let query = {
                'importMetadata.funder': this.funderId
            };

            if (onlySelected) {
                query['syncMetadata.needsSync'] = true;
            }

            // Get all OrgMeter syndicators that need syncing
            const orgMeterSyndicators = await OrgMeterSyndicator.find(query).sort({ updatedAt: 1 });
            this.syncStats.totalProcessed = orgMeterSyndicators.length;

            if (orgMeterSyndicators.length === 0) {
                console.log('No OrgMeter syndicators found for syncing');
                return this.getSyncResults();
            }

            console.log(`Found ${orgMeterSyndicators.length} OrgMeter syndicators to sync`);

            if (dryRun) {
                console.log('Dry run mode - not saving to database');
                return this.getSyncResults();
            }

            // Process each syndicator
            for (let i = 0; i < orgMeterSyndicators.length; i++) {
                const orgMeterSyndicator = orgMeterSyndicators[i];
                
                try {
                    const result = await this.syncSyndicator(orgMeterSyndicator, updateExisting);
                    
                    if (result.action === 'synced') {
                        this.syncStats.totalSynced++;
                    } else if (result.action === 'updated') {
                        this.syncStats.totalUpdated++;
                    } else if (result.action === 'skipped') {
                        this.syncStats.totalSkipped++;
                    }

                    // Update sync metadata
                    await this.updateSyncMetadata(orgMeterSyndicator, result.syncedSyndicator?._id);

                    // Update progress if callback provided
                    if (progressCallback) {
                        await progressCallback(i + 1, orgMeterSyndicators.length, orgMeterSyndicator.name);
                    }

                } catch (error) {
                    console.error(`Failed to sync syndicator ${orgMeterSyndicator.id}:`, error.message);
                    this.syncStats.totalFailed++;
                    this.syncStats.errors.push({
                        orgMeterId: orgMeterSyndicator.id,
                        name: orgMeterSyndicator.name,
                        error: error.message
                    });

                    // Still update progress even on error
                    if (progressCallback) {
                        await progressCallback(i + 1, orgMeterSyndicators.length, orgMeterSyndicator.name);
                    }
                }
            }

            console.log('OrgMeter syndicators sync completed');
            return this.getSyncResults();

        } catch (error) {
            console.error('Error during syndicators sync:', error.message);
            throw new ErrorResponse(`Sync failed: ${error.message}`, 500);
        }
    }

    /**
     * Sync a single OrgMeter syndicator to system syndicator
     * @param {Object} orgMeterSyndicator - OrgMeter syndicator document
     * @param {boolean} updateExisting - Whether to update existing syndicators
     * @returns {Object} Sync result
     */
    async syncSyndicator(orgMeterSyndicator, updateExisting = true) {
        try {
            let existingSyndicator = null;
            
            // First, check if syndicator already exists by syncId
            if (orgMeterSyndicator.syncMetadata?.syncId) {
                existingSyndicator = await Syndicator.findById(orgMeterSyndicator.syncMetadata.syncId);
            }
            
            // If not found by syncId, check by email (if email exists)
            if (!existingSyndicator && orgMeterSyndicator.email) {
                existingSyndicator = await Syndicator.findOne({ 
                    email: orgMeterSyndicator.email.toLowerCase().trim() 
                });
                
                // If found by email, update the syncId in OrgMeter record
                if (existingSyndicator) {
                    console.log(`Found existing syndicator by email: ${orgMeterSyndicator.email} (ID: ${existingSyndicator._id})`);
                    await this.updateSyncMetadata(orgMeterSyndicator, existingSyndicator._id);
                }
            }

            if (existingSyndicator) {
                if (updateExisting) {
                    // Update existing syndicator
                    const updatedSyndicator = await this.updateExistingSyndicator(existingSyndicator, orgMeterSyndicator);
                    return {
                        action: 'updated',
                        syncedSyndicator: updatedSyndicator,
                        message: `Updated existing syndicator: ${updatedSyndicator.name}`
                    };
                } else {
                    return {
                        action: 'skipped',
                        syncedSyndicator: existingSyndicator,
                        message: `Skipped existing syndicator: ${existingSyndicator.name}`
                    };
                }
            } else {
                // Create new syndicator
                const newSyndicator = await this.createNewSyndicator(orgMeterSyndicator);
                return {
                    action: 'synced',
                    syncedSyndicator: newSyndicator,
                    message: `Created new syndicator: ${newSyndicator.name}`
                };
            }

        } catch (error) {
            throw new Error(`Failed to sync syndicator ${orgMeterSyndicator.name}: ${error.message}`);
        }
    }

    
    /**
     * Transform OrgMeter Syndicator data to system Syndicator format
     * @param {Object} orgMeterSyndicator - OrgMeter Syndicator document
     * @returns {Object} Transformed syndicator data
     */
    transform(orgMeterSyndicator) {
        const parsedName = this.parseHumanName(orgMeterSyndicator.name);
        
        return {
            name: orgMeterSyndicator.name,
            email: orgMeterSyndicator.email || undefined,
            phone_mobile: orgMeterSyndicator.phone || undefined,
            phone_work: undefined,
            phone_home: undefined,
            first_name: parsedName.firstName,
            last_name: parsedName.lastName,
            business_detail: undefined,
            address_detail: undefined,
            password: orgMeterSyndicator.email ? orgMeterSyndicator.id.toString() : undefined,
            inactive: orgMeterSyndicator.deleted || false
        };
    }

    /**
     * Parse human names from syndicator names (which can be mixed human/company names)
     * @param {string} fullName - The full name to parse
     * @returns {Object} Object with firstName and lastName properties
     */
    parseHumanName(fullName) {
        if (!fullName || typeof fullName !== 'string') {
            return { firstName: undefined, lastName: undefined };
        }

        const name = fullName.trim();
        
        // Company indicators - if any of these are present, it's likely a company name
        const companyIndicators = [
            'Inc', 'LLC', 'Corp', 'Corporation', 'Ltd', 'Limited', 'Company', 'Co',
            'Enterprises', 'Enterprise', 'Solutions', 'Group', 'Holdings', 'Partners',
            'Associates', 'Services', 'Consulting', 'Management', 'Ventures', 'Venture',
            'Capital', 'Investments', 'Financial', 'Funding', 'Finance'
        ];

        // Check if it contains company indicators
        const hasCompanyIndicator = companyIndicators.some(indicator => 
            name.toLowerCase().includes(indicator.toLowerCase())
        );

        if (hasCompanyIndicator) {
            // Try to extract human name from company name patterns
            return this.extractHumanNameFromCompany(name);
        } else {
            // Treat as human name and parse normally
            return this.parsePersonName(name);
        }
    }

    /**
     * Extract human name from company name patterns
     * @param {string} companyName - Company name that might contain human name
     * @returns {Object} Object with firstName and lastName properties
     */
    extractHumanNameFromCompany(companyName) {
        // Pattern 1: "Company Name - First Last" (e.g., "Gnyp Holdings Inc - Jared Gnyp")
        let match = companyName.match(/^.+?\s*-\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)$/);
        if (match) {
            return this.parsePersonName(match[1]);
        }

        // Pattern 2: "First Last (Company)" (e.g., "George Theodorou (GNT Enterprises)")
        match = companyName.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s*\(.+\)$/);
        if (match) {
            return this.parsePersonName(match[1]);
        }

        // Pattern 3: "First Last Company" where company is single word (e.g., "Eltin Hadzi Enterprises")
        // Look for pattern: FirstName LastName + single company word
        const companyWords = ['Inc', 'LLC', 'Corp', 'Corporation', 'Ltd', 'Limited', 'Company', 
            'Enterprises', 'Enterprise', 'Solutions', 'Group', 'Holdings', 
            'Partners', 'Associates', 'Services', 'Consulting', 'Management',
            'Ventures', 'Venture', 'Capital', 'Investments', 'Financial', 
            'Funding', 'Finance'];
        
        for (const companyWord of companyWords) {
            const regex = new RegExp(`^([A-Z][a-z]+\\s+[A-Z][a-z]+)\\s+${companyWord}`, 'i');
            match = companyName.match(regex);
            if (match) {
                return this.parsePersonName(match[1]);
            }
        }

        // Pattern 4: Look for common patterns where human name comes first
        // "FirstName LastName Something" - take first two capitalized words
        match = companyName.match(/^([A-Z][a-z]+)\s+([A-Z][a-z]+)/);
        if (match) {
            // Verify it's likely a human name (not something like "Unified Funding")
            const firstName = match[1];
            const lastName = match[2];
            
            // Common first names to help identify human names
            const commonFirstNames = [
                'Aaron', 'Adam', 'Adrian', 'Alan', 'Albert', 'Alex', 'Alexander', 'Andrew', 'Anthony', 'Antonio',
                'Arthur', 'Benjamin', 'Bernard', 'Bobby', 'Brandon', 'Brian', 'Bruce', 'Carl', 'Carlos', 'Charles',
                'Chris', 'Christopher', 'Daniel', 'David', 'Dennis', 'Donald', 'Douglas', 'Eddie', 'Edward', 'Eltin',
                'Eric', 'Eugene', 'Frank', 'Gary', 'George', 'Gerald', 'Gregory', 'Harold', 'Henry', 'Jack',
                'James', 'Jared', 'Jason', 'Jeffrey', 'Jeremy', 'Jerry', 'Jesse', 'Joe', 'John', 'Johnny',
                'Jonathan', 'Joseph', 'Joshua', 'Juan', 'Justin', 'Keith', 'Kenneth', 'Kevin', 'Larry', 'Lawrence',
                'Louis', 'Mark', 'Martin', 'Matthew', 'Michael', 'Nicholas', 'Patrick', 'Paul', 'Peter', 'Philip',
                'Ralph', 'Raymond', 'Richard', 'Robert', 'Roger', 'Ronald', 'Roy', 'Russell', 'Ryan', 'Samuel',
                'Scott', 'Sean', 'Stephen', 'Steven', 'Thomas', 'Timothy', 'Victor', 'Walter', 'Wayne', 'William'
            ];

            if (commonFirstNames.includes(firstName)) {
                return { firstName, lastName };
            }
        }

        // If no pattern matches, return undefined for human names
        return { firstName: undefined, lastName: undefined };
    }

    /**
     * Parse a person's name into first and last name
     * @param {string} personName - Full person name
     * @returns {Object} Object with firstName and lastName properties
     */
    parsePersonName(personName) {
        if (!personName || typeof personName !== 'string') {
            return { firstName: undefined, lastName: undefined };
        }

        const nameParts = personName.trim().split(/\s+/);
        
        if (nameParts.length === 1) {
            return { firstName: nameParts[0], lastName: undefined };
        } else if (nameParts.length === 2) {
            return { firstName: nameParts[0], lastName: nameParts[1] };
        } else {
            // For 3+ parts, take first as firstName and rest as lastName
            return { 
                firstName: nameParts[0], 
                lastName: nameParts.slice(1).join(' ') 
            };
        }
    }

    /**
     * Create a new system syndicator from OrgMeter syndicator
     * @param {Object} orgMeterSyndicator - OrgMeter syndicator document
     * @returns {Object} Created syndicator document
     */
    async createNewSyndicator(orgMeterSyndicator) {
        try {
            const syndicatorData = this.transform(orgMeterSyndicator);

            const syndicator = new Syndicator(syndicatorData);
            await syndicator.save();

            console.log(`Created new syndicator: ${syndicator.name} (ID: ${syndicator._id})`);

            // Create SyndicatorFunder relationship
            await this.createSyndicatorFunder(syndicator._id, orgMeterSyndicator);

            return syndicator;

        } catch (error) {
            throw new Error(`Failed to create syndicator: ${error.message}`);
        }
    }

    /**
     * Update an existing system syndicator with OrgMeter syndicator data
     * @param {Object} existingSyndicator - Existing system syndicator document
     * @param {Object} orgMeterSyndicator - OrgMeter syndicator document
     * @returns {Object} Updated syndicator document
     */
    async updateExistingSyndicator(existingSyndicator, orgMeterSyndicator) {
        try {
            // Update fields that may have changed
            const updateData = this.transform(orgMeterSyndicator);

            // Only update if there are actual changes
            if (Object.keys(updateData).length > 0) {
                Object.assign(existingSyndicator, updateData);
                await existingSyndicator.save();
                console.log(`Updated syndicator: ${existingSyndicator.name} (ID: ${existingSyndicator._id})`);
            } else {
                console.log(`No changes needed for syndicator: ${existingSyndicator.name}`);
            }

            // Update or create SyndicatorFunder relationship
            await this.updateSyndicatorFunder(existingSyndicator._id, orgMeterSyndicator);

            return existingSyndicator;

        } catch (error) {
            throw new Error(`Failed to update syndicator: ${error.message}`);
        }
    }

    /**
     * Create SyndicatorFunder relationship
     * @param {String} syndicatorId - System syndicator ID
     * @param {Object} orgMeterSyndicator - OrgMeter syndicator document
     */
    async createSyndicatorFunder(syndicatorId, orgMeterSyndicator) {
        try {
            // Check if SyndicatorFunder already exists
            const existingSyndicatorFunder = await SyndicatorFunder.findOne({
                syndicator: syndicatorId,
                funder: this.funderId
            });

            if (existingSyndicatorFunder) {
                console.log(`SyndicatorFunder relationship already exists for syndicator ${syndicatorId}`);
                return existingSyndicatorFunder;
            }

            // Parse available balance from OrgMeter data
            const availableBalance = this.parseAvailableBalance(orgMeterSyndicator.availableBalanceAmount);

            const syndicatorFunderData = {
                syndicator: syndicatorId,
                funder: this.funderId,
                available_balance: availableBalance,
                payout_frequency: SYNDICATOR_PAYOUT_FREQUENCY.WEEKLY, // Default value
                inactive: orgMeterSyndicator.deleted || false
            };

            const syndicatorFunder = new SyndicatorFunder(syndicatorFunderData);
            await syndicatorFunder.save();

            console.log(`Created SyndicatorFunder relationship: Syndicator ${syndicatorId}, Funder ${this.funderId}, Balance: ${availableBalance}`);
            return syndicatorFunder;

        } catch (error) {
            console.error(`Failed to create SyndicatorFunder relationship: ${error.message}`);
            throw error;
        }
    }

    /**
     * Update SyndicatorFunder relationship
     * @param {String} syndicatorId - System syndicator ID
     * @param {Object} orgMeterSyndicator - OrgMeter syndicator document
     */
    async updateSyndicatorFunder(syndicatorId, orgMeterSyndicator) {
        try {
            const availableBalance = this.parseAvailableBalance(orgMeterSyndicator.availableBalanceAmount);
            const shouldBeInactive = orgMeterSyndicator.deleted || false;

            // Find existing SyndicatorFunder
            let syndicatorFunder = await SyndicatorFunder.findOne({
                syndicator: syndicatorId,
                funder: this.funderId
            });

            if (syndicatorFunder) {
                // Update existing relationship
                const updateData = {};
                
                if (syndicatorFunder.available_balance !== availableBalance) {
                    updateData.available_balance = availableBalance;
                }
                
                if (syndicatorFunder.inactive !== shouldBeInactive) {
                    updateData.inactive = shouldBeInactive;
                }

                if (Object.keys(updateData).length > 0) {
                    Object.assign(syndicatorFunder, updateData);
                    await syndicatorFunder.save();
                    console.log(`Updated SyndicatorFunder relationship: Balance ${availableBalance}, Inactive: ${shouldBeInactive}`);
                }
            } else {
                // Create new relationship if it doesn't exist
                await this.createSyndicatorFunder(syndicatorId, orgMeterSyndicator);
            }

        } catch (error) {
            console.error(`Failed to update SyndicatorFunder relationship: ${error.message}`);
            throw error;
        }
    }

    /**
     * Parse available balance amount from OrgMeter string format
     * Notice that this amout should be returned in cents
     * @param {String} balanceString - Balance amount as string (e.g., "1000.00", "$1,000.00")
     * @returns {Number} Parsed balance as number
     */
    parseAvailableBalance(balanceString) {
        if (!balanceString || typeof balanceString !== 'string') {
            return 0;
        }

        // Remove currency symbols, commas, and whitespace
        const cleanString = balanceString.replace(/[$,\s]/g, '');
        
        // Parse as float
        const balance = parseFloat(cleanString);
        
        // Return 0 if parsing failed or result is NaN
        return isNaN(balance) ? 0 : Math.round(balance * 100);
    }

    /**
     * Update sync metadata for OrgMeter syndicator
     * @param {Object} orgMeterSyndicator - OrgMeter syndicator document
     * @param {String} syncedSyndicatorId - ID of the synced system syndicator
     */
    async updateSyncMetadata(orgMeterSyndicator, syncedSyndicatorId = null) {
        try {
            const updateData = {
                'syncMetadata.lastSyncedAt': new Date(),
                'syncMetadata.lastSyncedBy': this.userId || 'system'
            };

            if (syncedSyndicatorId) {
                updateData['syncMetadata.syncId'] = syncedSyndicatorId;
                // Don't change needsSync - it remains as user's selection
            }

            await OrgMeterSyndicator.findByIdAndUpdate(orgMeterSyndicator._id, updateData);

        } catch (error) {
            console.error(`Failed to update sync metadata for syndicator ${orgMeterSyndicator.id}:`, error.message);
        }
    }

    /**
     * Mark specific OrgMeter syndicators as needing sync
     * @param {Array} syndicatorIds - Array of OrgMeter syndicator IDs (numeric IDs)
     * @returns {Object} Update result
     */
    async markSyndicatorsForSync(syndicatorIds) {
        try {
            const result = await OrgMeterSyndicator.updateMany(
                {
                    id: { $in: syndicatorIds },
                    'importMetadata.funder': this.funderId
                },
                {
                    $set: {
                        'syncMetadata.needsSync': true,
                        'syncMetadata.lastSyncedAt': null,
                        'syncMetadata.syncId': null
                    }
                }
            );

            return {
                success: true,
                message: `Marked ${result.nModified} syndicators for sync`,
                modifiedCount: result.nModified
            };

        } catch (error) {
            throw new ErrorResponse(`Failed to mark syndicators for sync: ${error.message}`, 500);
        }
    }

    /**
     * Get sync results summary
     * @returns {Object} Sync statistics
     */
    getSyncResults() {
        return {
            success: true,
            message: 'Syndicator sync completed',
            stats: {
                totalProcessed: this.syncStats.totalProcessed,
                totalSynced: this.syncStats.totalSynced,
                totalUpdated: this.syncStats.totalUpdated,
                totalSkipped: this.syncStats.totalSkipped,
                totalFailed: this.syncStats.totalFailed,
                errorCount: this.syncStats.errors.length,
                errors: this.syncStats.errors
            }
        };
    }

    /**
     * Get sync status for OrgMeter syndicators
     * @param {Object} options - Query options
     * @returns {Object} Sync status data
     */
    async getSyncStatus(options = {}) {
        try {
            const {
                page = 1,
                limit = 20,
                search = null,
                syncStatus = 'all' // 'all', 'pending', 'synced', 'ignored'
            } = options;

            let query = {
                'importMetadata.funder': this.funderId
            };

            // Apply sync status filter
            if (syncStatus === 'pending') {
                query['syncMetadata.needsSync'] = true;
                query['syncMetadata.syncId'] = { $exists: false };
            } else if (syncStatus === 'synced') {
                query['syncMetadata.syncId'] = { $exists: true, $ne: null };
            } else if (syncStatus === 'ignored') {
                query['syncMetadata.needsSync'] = false;
            }

            // Apply search filter
            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ];
            }

            const skip = (page - 1) * limit;
            const syndicators = await OrgMeterSyndicator.find(query)
                .populate('syncMetadata.syncId', 'name email')
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(limit);

            const total = await OrgMeterSyndicator.countDocuments(query);

            // Get overall sync statistics
            const syncStats = await OrgMeterSyndicator.aggregate([
                { $match: { 'importMetadata.funder': this.funderId } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        selected: {
                            $sum: {
                                $cond: [{ $eq: ['$syncMetadata.needsSync', true] }, 1, 0]
                            }
                        },
                        synced: {
                            $sum: {
                                $cond: [{ $ne: ['$syncMetadata.syncId', null] }, 1, 0]
                            }
                        },
                        ignored: {
                            $sum: {
                                $cond: [{ $eq: ['$syncMetadata.needsSync', false] }, 1, 0]
                            }
                        }
                    }
                }
            ]);

            const stats = syncStats[0] || { total: 0, pending: 0, synced: 0, ignored: 0 };

            return {
                success: true,
                data: {
                    syndicators,
                    pagination: {
                        current: page,
                        pages: Math.ceil(total / limit),
                        total,
                        limit
                    },
                    stats: {
                        total: stats.total,
                        selected: stats.selected,
                        pending: stats.selected - stats.synced,
                        synced: stats.synced,
                        ignored: stats.ignored
                    }
                }
            };

        } catch (error) {
            throw new ErrorResponse(`Failed to get sync status: ${error.message}`, 500);
        }
    }
}

module.exports = SyncOrgMeterSyndicatorService; 