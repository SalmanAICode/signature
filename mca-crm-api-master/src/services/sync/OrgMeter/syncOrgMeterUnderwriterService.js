const { model: OrgMeterUnderwriterUser } = require('../../../models/OrgMeter/UnderwriterUser');
const User = require('../../../models/User');
const UserFunder = require('../../../models/UserFunder');
const Funder = require('../../../models/Funder');
const ErrorResponse = require('../../../utils/errorResponse');
const { ROLES } = require('../../../utils/permissions');

/**
 * Sync OrgMeter underwriter users to system users
 */
class SyncOrgMeterUnderwriterService {
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
     * Sync all selected OrgMeter underwriter users to system users
     * @param {Object} options - Sync options
     * @returns {Object} Sync results
     */
    async syncAllUnderwriters(options = {}) {
        const {
            dryRun = false,
            updateExisting = true,
            onlySelected = true,
            progressCallback = null
        } = options;

        try {
            console.log('Starting OrgMeter underwriter users sync...');
            
            // Verify funder exists
            const funder = await Funder.findById(this.funderId);
            if (!funder) {
                throw new ErrorResponse('Funder not found', 404);
            }

            // Build query for OrgMeter underwriter users to sync
            let query = {
                'importMetadata.funder': this.funderId
            };

            if (onlySelected) {
                query['syncMetadata.needsSync'] = true;
            }

            // Get all OrgMeter underwriter users that need syncing
            const orgMeterUnderwriters = await OrgMeterUnderwriterUser.find(query).sort({ 'importMetadata.importedAt': 1 });
            this.syncStats.totalProcessed = orgMeterUnderwriters.length;

            if (orgMeterUnderwriters.length === 0) {
                console.log('No OrgMeter underwriter users found for syncing');
                return this.getSyncResults();
            }

            console.log(`Found ${orgMeterUnderwriters.length} OrgMeter underwriter users to sync`);

            if (dryRun) {
                console.log('Dry run mode - not saving to database');
                return this.getSyncResults();
            }

            // Process each underwriter user
            for (let i = 0; i < orgMeterUnderwriters.length; i++) {
                const orgMeterUnderwriter = orgMeterUnderwriters[i];
                
                try {
                    const result = await this.syncUnderwriter(orgMeterUnderwriter, updateExisting);
                    
                    if (result.action === 'synced') {
                        this.syncStats.totalSynced++;
                    } else if (result.action === 'updated') {
                        this.syncStats.totalUpdated++;
                    } else if (result.action === 'skipped') {
                        this.syncStats.totalSkipped++;
                    }

                    // Update sync metadata
                    await this.updateSyncMetadata(orgMeterUnderwriter, result.syncedUser?._id);

                    // Update progress if callback provided
                    if (progressCallback) {
                        await progressCallback(i + 1, orgMeterUnderwriters.length, this.getUnderwriterDisplayName(orgMeterUnderwriter));
                    }

                } catch (error) {
                    console.error(`Failed to sync underwriter user ${orgMeterUnderwriter.id}:`, error.message);
                    this.syncStats.totalFailed++;
                    this.syncStats.errors.push({
                        orgMeterId: orgMeterUnderwriter.id,
                        name: this.getUnderwriterDisplayName(orgMeterUnderwriter),
                        error: error.message
                    });

                    // Still update progress even on error
                    if (progressCallback) {
                        await progressCallback(i + 1, orgMeterUnderwriters.length, this.getUnderwriterDisplayName(orgMeterUnderwriter));
                    }
                }
            }

            console.log('OrgMeter underwriter users sync completed');
            return this.getSyncResults();

        } catch (error) {
            console.error('Error during underwriter users sync:', error.message);
            throw new ErrorResponse(`Sync failed: ${error.message}`, 500);
        }
    }

    /**
     * Transform OrgMeter underwriter user data to system user format
     * @param {Object} orgMeterUnderwriter - OrgMeter underwriter user document
     * @returns {Object} Transformed user data
     */
    transform(orgMeterUnderwriter) {
        return {
            first_name: orgMeterUnderwriter.firstName || 'Unknown',
            last_name: orgMeterUnderwriter.lastName || 'Underwriter',
            email: orgMeterUnderwriter.email || undefined,
            phone_mobile: undefined, // OrgMeter underwriter doesn't have phone
            phone_work: undefined,
            phone_home: undefined,
            birthday: undefined,
            address_detail: undefined,
            type: ROLES.FUNDER_USER, // Underwriters are funder users
            permission_list: [],
            last_login: undefined,
            online: false,
            password: orgMeterUnderwriter.email ? orgMeterUnderwriter.id.toString() : undefined, // Use OrgMeter ID as default password
            inactive: false // Underwriters are typically active
        };
    }

    /**
     * Get display name for underwriter user
     * @param {Object} orgMeterUnderwriter - OrgMeter underwriter user document
     * @returns {String} Display name
     */
    getUnderwriterDisplayName(orgMeterUnderwriter) {
        if (orgMeterUnderwriter.firstName && orgMeterUnderwriter.lastName) {
            return `${orgMeterUnderwriter.firstName} ${orgMeterUnderwriter.lastName}`;
        }
        return orgMeterUnderwriter.email || `Underwriter ${orgMeterUnderwriter.id}`;
    }

    /**
     * Sync a single OrgMeter underwriter user to system user
     * @param {Object} orgMeterUnderwriter - OrgMeter underwriter user document
     * @param {boolean} updateExisting - Whether to update existing users
     * @returns {Object} Sync result
     */
    async syncUnderwriter(orgMeterUnderwriter, updateExisting = true) {
        try {
            let existingUser = null;
            
            // First, check if user already exists by syncId
            if (orgMeterUnderwriter.syncMetadata?.syncId) {
                existingUser = await User.findById(orgMeterUnderwriter.syncMetadata.syncId);
            }
            
            // If not found by syncId, check by email (if email exists)
            if (!existingUser && orgMeterUnderwriter.email) {
                existingUser = await User.findOne({ 
                    email: orgMeterUnderwriter.email.toLowerCase().trim() 
                });
                
                // If found by email, update the syncId in OrgMeter record
                if (existingUser) {
                    console.log(`Found existing user by email: ${orgMeterUnderwriter.email} (ID: ${existingUser._id})`);
                    await this.updateSyncMetadata(orgMeterUnderwriter, existingUser._id);
                }
            }

            if (existingUser) {
                if (updateExisting) {
                    // Update existing user
                    const updatedUser = await this.updateExistingUser(existingUser, orgMeterUnderwriter);
                    return {
                        action: 'updated',
                        syncedUser: updatedUser,
                        message: `Updated existing underwriter user: ${this.getUnderwriterDisplayName(orgMeterUnderwriter)}`
                    };
                } else {
                    return {
                        action: 'skipped',
                        syncedUser: existingUser,
                        message: `Skipped existing underwriter user: ${this.getUnderwriterDisplayName(orgMeterUnderwriter)}`
                    };
                }
            } else {
                // Create new user
                const newUser = await this.createNewUser(orgMeterUnderwriter);
                return {
                    action: 'synced',
                    syncedUser: newUser,
                    message: `Created new underwriter user: ${this.getUnderwriterDisplayName(orgMeterUnderwriter)}`
                };
            }

        } catch (error) {
            throw new Error(`Failed to sync underwriter user ${this.getUnderwriterDisplayName(orgMeterUnderwriter)}: ${error.message}`);
        }
    }

    /**
     * Create a new system user from OrgMeter underwriter user
     * @param {Object} orgMeterUnderwriter - OrgMeter underwriter user document
     * @returns {Object} Created user document
     */
    async createNewUser(orgMeterUnderwriter) {
        try {
            const userData = this.transform(orgMeterUnderwriter);

            const user = new User(userData);
            await user.save();

            console.log(`Created new underwriter user: ${this.getUnderwriterDisplayName(orgMeterUnderwriter)} (ID: ${user._id})`);

            // Create UserFunder relationship
            await this.createUserFunder(user._id);

            return user;

        } catch (error) {
            throw new Error(`Failed to create underwriter user: ${error.message}`);
        }
    }

    /**
     * Update an existing system user with OrgMeter underwriter user data
     * @param {Object} existingUser - Existing system user document
     * @param {Object} orgMeterUnderwriter - OrgMeter underwriter user document
     * @returns {Object} Updated user document
     */
    async updateExistingUser(existingUser, orgMeterUnderwriter) {
        try {
            // Update fields that may have changed
            const updateData = {};
            const transformedData = this.transform(orgMeterUnderwriter);

            // Compare and update changed fields
            Object.keys(transformedData).forEach(key => {
                if (existingUser[key] !== transformedData[key]) {
                    updateData[key] = transformedData[key];
                }
            });

            // Only update if there are actual changes
            if (Object.keys(updateData).length > 0) {
                Object.assign(existingUser, updateData);
                await existingUser.save();
                console.log(`Updated underwriter user: ${this.getUnderwriterDisplayName(orgMeterUnderwriter)} (ID: ${existingUser._id})`);
            } else {
                console.log(`No changes needed for underwriter user: ${this.getUnderwriterDisplayName(orgMeterUnderwriter)}`);
            }

            // Update or create UserFunder relationship
            await this.updateUserFunder(existingUser._id);

            return existingUser;

        } catch (error) {
            throw new Error(`Failed to update underwriter user: ${error.message}`);
        }
    }

    /**
     * Create UserFunder relationship
     * @param {String} userId - System user ID
     */
    async createUserFunder(userId) {
        try {
            // Check if UserFunder already exists
            const existingUserFunder = await UserFunder.findOne({
                user: userId,
                funder: this.funderId
            });

            if (existingUserFunder) {
                console.log(`UserFunder relationship already exists for underwriter user ${userId}`);
                return existingUserFunder;
            }

            const userFunderData = {
                user: userId,
                funder: this.funderId
            };

            const userFunder = new UserFunder(userFunderData);
            await userFunder.save();

            console.log(`Created UserFunder relationship: Underwriter User ${userId}, Funder ${this.funderId}`);
            return userFunder;

        } catch (error) {
            console.error(`Failed to create UserFunder relationship: ${error.message}`);
            throw error;
        }
    }

    /**
     * Update UserFunder relationship
     * @param {String} userId - System user ID
     */
    async updateUserFunder(userId) {
        try {
            // Find existing UserFunder
            let userFunder = await UserFunder.findOne({
                user: userId,
                funder: this.funderId
            });

            if (!userFunder) {
                // Create new relationship if it doesn't exist
                await this.createUserFunder(userId);
            }
            // UserFunder is simple - no fields to update besides the relationship itself

        } catch (error) {
            console.error(`Failed to update UserFunder relationship: ${error.message}`);
            throw error;
        }
    }

    /**
     * Update sync metadata for OrgMeter underwriter user
     * @param {Object} orgMeterUnderwriter - OrgMeter underwriter user document
     * @param {String} syncedUserId - ID of the synced system user
     */
    async updateSyncMetadata(orgMeterUnderwriter, syncedUserId = null) {
        try {
            const updateData = {
                'syncMetadata.lastSyncedAt': new Date(),
                'syncMetadata.lastSyncedBy': this.userId || 'system'
            };

            if (syncedUserId) {
                updateData['syncMetadata.syncId'] = syncedUserId;
                // Don't change needsSync - it remains as user's selection
            }

            await OrgMeterUnderwriterUser.findByIdAndUpdate(orgMeterUnderwriter._id, updateData);

        } catch (error) {
            console.error(`Failed to update sync metadata for underwriter user ${orgMeterUnderwriter.id}:`, error.message);
        }
    }

    /**
     * Mark specific OrgMeter underwriter users as needing sync
     * @param {Array} underwriterIds - Array of OrgMeter underwriter user IDs (numeric IDs)
     * @returns {Object} Update result
     */
    async markUnderwritersForSync(underwriterIds) {
        try {
            const result = await OrgMeterUnderwriterUser.updateMany(
                {
                    id: { $in: underwriterIds },
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
                message: `Marked ${result.nModified} underwriter users for sync`,
                modifiedCount: result.nModified
            };

        } catch (error) {
            throw new ErrorResponse(`Failed to mark underwriter users for sync: ${error.message}`, 500);
        }
    }

    /**
     * Get sync results summary
     * @returns {Object} Sync statistics
     */
    getSyncResults() {
        return {
            success: true,
            message: 'Underwriter user sync completed',
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
     * Get sync status for OrgMeter underwriter users
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
                    { firstName: { $regex: search, $options: 'i' } },
                    { lastName: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ];
            }

            const skip = (page - 1) * limit;
            const underwriters = await OrgMeterUnderwriterUser.find(query)
                .populate('syncMetadata.syncId', 'first_name last_name email')
                .sort({ 'importMetadata.importedAt': -1 })
                .skip(skip)
                .limit(limit);

            const total = await OrgMeterUnderwriterUser.countDocuments(query);

            // Get overall sync statistics
            const syncStats = await OrgMeterUnderwriterUser.aggregate([
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
                    underwriters,
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

module.exports = SyncOrgMeterUnderwriterService; 