const OrgMeterUser = require('../../../models/OrgMeter/User');
const OrgMeterSyndicator = require('../../../models/OrgMeter/Syndicator');
const OrgMeterLender = require('../../../models/OrgMeter/Lender');
const Syndicator = require('../../../models/Syndicator');

const User = require('../../../models/User');
const UserFunder = require('../../../models/UserFunder');
const UserLender = require('../../../models/UserLender');
const Funder = require('../../../models/Funder');
const ErrorResponse = require('../../../utils/errorResponse');
const { ROLES } = require('../../../utils/permissions');

const SyncOrgMeterSyndicatorService = require('./syncOrgMeterSyndicatorService');

/**
 * Sync OrgMeter users to system users
 */
class SyncOrgMeterUserService {
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
     * Sync all selected OrgMeter users to system users
     * @param {Object} options - Sync options
     * @returns {Object} Sync results
     */
    async syncAllUsers(options = {}) {
        const {
            dryRun = false,
            updateExisting = true,
            onlySelected = true,
            progressCallback = null
        } = options;

        try {
            console.log('Starting OrgMeter users sync...');
            
            // Verify funder exists
            const funder = await Funder.findById(this.funderId);
            if (!funder) {
                throw new ErrorResponse('Funder not found', 404);
            }

            // Build query for OrgMeter users to sync
            let query = {
                'importMetadata.funder': this.funderId
            };

            if (onlySelected) {
                query['syncMetadata.needsSync'] = true;
            }

            // Get all OrgMeter users that need syncing
            const orgMeterUsers = await OrgMeterUser.find(query).sort({ updatedAt: 1 });
            this.syncStats.totalProcessed = orgMeterUsers.length;

            if (orgMeterUsers.length === 0) {
                console.log('No OrgMeter users found for syncing');
                return this.getSyncResults();
            }

            console.log(`Found ${orgMeterUsers.length} OrgMeter users to sync`);

            if (dryRun) {
                console.log('Dry run mode - not saving to database');
                return this.getSyncResults();
            }

            // Process each user
            for (let i = 0; i < orgMeterUsers.length; i++) {
                const orgMeterUser = orgMeterUsers[i];
                
                try {
                    const result = await this.syncUser(orgMeterUser, updateExisting);
                    
                    if (result.action === 'synced') {
                        this.syncStats.totalSynced++;
                    } else if (result.action === 'updated') {
                        this.syncStats.totalUpdated++;
                    } else if (result.action === 'skipped') {
                        this.syncStats.totalSkipped++;
                    }

                    // Update sync metadata
                    await this.updateSyncMetadata(orgMeterUser, result.syncedUser?._id);

                    // Update progress if callback provided
                    if (progressCallback) {
                        await progressCallback(i + 1, orgMeterUsers.length, this.getUserDisplayName(orgMeterUser));
                    }

                } catch (error) {
                    console.error(`Failed to sync user ${orgMeterUser.id}:`, error.message);
                    this.syncStats.totalFailed++;
                    this.syncStats.errors.push({
                        orgMeterId: orgMeterUser.id,
                        name: this.getUserDisplayName(orgMeterUser),
                        error: error.message
                    });

                    // Still update progress even on error
                    if (progressCallback) {
                        await progressCallback(i + 1, orgMeterUsers.length, this.getUserDisplayName(orgMeterUser));
                    }
                }
            }

            console.log('OrgMeter users sync completed');
            return this.getSyncResults();

        } catch (error) {
            console.error('Error during users sync:', error.message);
            throw new ErrorResponse(`Sync failed: ${error.message}`, 500);
        }
    }

    /**
     * Transform OrgMeter user data to system user format
     * @param {Object} orgMeterUser - OrgMeter user document
     * @returns {Object} Transformed user data
     */
    transform(orgMeterUser) {
        return {
            first_name: orgMeterUser.firstName || 'Unknown',
            last_name: orgMeterUser.lastName || 'User',
            email: orgMeterUser.email || undefined,
            phone_mobile: orgMeterUser.phone || undefined,
            phone_work: undefined,
            phone_home: undefined,
            birthday: undefined,
            address_detail: undefined,
            type: this.mapUserType(orgMeterUser.roles),
            permission_list: [],
            last_login: undefined,
            online: false,
            password: orgMeterUser.email ? orgMeterUser.id.toString() : undefined,
            inactive: !orgMeterUser.enabled
        };
    }

    /**
     * Map OrgMeter roles to system user type
     * @param {Array} roles - OrgMeter roles array
     * @returns {String} System user type
     */
    mapUserType(roles) {
        if (!roles || !Array.isArray(roles)) {
            throw new Error('User roles are required and must be an array');
        }

        // Check for admin role first
        if (roles.includes('ROLE_ADMIN')) {
            return ROLES.FUNDER_MANAGER;
        }

        // Check for user role
        if (roles.includes('ROLE_USER')) {
            return ROLES.FUNDER_USER;
        }

        // If neither ROLE_ADMIN nor ROLE_USER is found, throw an error
        throw new Error(`Invalid user roles: ${roles.join(', ')}. User must have either ROLE_ADMIN or ROLE_USER`);
    }

    /**
     * Get display name for user
     * @param {Object} orgMeterUser - OrgMeter user document
     * @returns {String} Display name
     */
    getUserDisplayName(orgMeterUser) {
        if (orgMeterUser.firstName && orgMeterUser.lastName) {
            return `${orgMeterUser.firstName} ${orgMeterUser.lastName}`;
        }
        return orgMeterUser.username || orgMeterUser.email || `User ${orgMeterUser.id}`;
    }

    /**
     * Sync a single OrgMeter user to system user
     * @param {Object} orgMeterUser - OrgMeter user document
     * @param {boolean} updateExisting - Whether to update existing users
     * @returns {Object} Sync result
     */
    async syncUser(orgMeterUser, updateExisting = true) {
        try {
            let existingUser = null;
            
            // First, check if user already exists by syncId
            if (orgMeterUser.syncMetadata?.syncId) {
                existingUser = await User.findById(orgMeterUser.syncMetadata.syncId);
            }

            // Second, check if user is other type of user, such as syndicator
            // This is based on the entity.type field.
            if (orgMeterUser.entity?.type === 'syndicator') {
                // This is a syndicator user, handle it differently
                const result = await this.syncSyndicatorUser(orgMeterUser);
                return result;
            } else {
                
                // If not found by syncId, check by email (if email exists)
                if (!existingUser && orgMeterUser.email) {
                    existingUser = await User.findOne({ 
                        email: orgMeterUser.email.toLowerCase().trim() 
                    });
                    
                    // If found by email, update the syncId in OrgMeter record
                    if (existingUser) {
                        console.log(`Found existing user by email: ${orgMeterUser.email} (ID: ${existingUser._id})`);
                        await this.updateSyncMetadata(orgMeterUser, existingUser._id);
                    }
                }

                if (existingUser) {
                    if (updateExisting) {
                        // Update existing user
                        const updatedUser = await this.updateExistingUser(existingUser, orgMeterUser);
                        return {
                            action: 'updated',
                            syncedUser: updatedUser,
                            message: `Updated existing user: ${this.getUserDisplayName(orgMeterUser)}`
                        };
                    } else {
                        return {
                            action: 'skipped',
                            syncedUser: existingUser,
                            message: `Skipped existing user: ${this.getUserDisplayName(orgMeterUser)}`
                        };
                    }
                } else {
                    // Create new user
                    const newUser = await this.createNewUser(orgMeterUser);
                    return {
                        action: 'synced',
                        syncedUser: newUser,
                        message: `Created new user: ${this.getUserDisplayName(orgMeterUser)}`
                    };
                }
            }
        } catch (error) {
            throw new Error(`Failed to sync user ${this.getUserDisplayName(orgMeterUser)}: ${error.message}`);
        }
    }

    /**
     * Create a new system user from OrgMeter user
     * @param {Object} orgMeterUser - OrgMeter user document
     * @returns {Object} Created user document
     */
    async createNewUser(orgMeterUser) {
        try {
            const userData = this.transform(orgMeterUser);

            const user = new User(userData);
            await user.save();

            console.log(`Created new user: ${this.getUserDisplayName(orgMeterUser)} (ID: ${user._id})`);

            // Create UserFunder relationship
            await this.createUserFunder(user._id);

            // Create UserLender relationship
            // First, find out all the lenders that the user is associated with based on the orgMeterLender.importMetadata.funder
            const orgMeterLenders = await OrgMeterLender.find({
                'importMetadata.funder': this.funderId
            });
            // Then, for each lender, create a UserLender relationship
            for (const orgMeterLender of orgMeterLenders) {
                if (orgMeterLender.syncMetadata?.syncId) {
                    await this.createUserLender(user._id, orgMeterLender.syncMetadata.syncId);
                }
            }

            return user;

        } catch (error) {
            throw new Error(`Failed to create user: ${error.message}`);
        }
    }

    /**
     * Update an existing system user with OrgMeter user data
     * @param {Object} existingUser - Existing system user document
     * @param {Object} orgMeterUser - OrgMeter user document
     * @returns {Object} Updated user document
     */
    async updateExistingUser(existingUser, orgMeterUser) {
        try {
            // Update fields that may have changed
            const updateData = {};
            const transformedData = this.transform(orgMeterUser);

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
                console.log(`Updated user: ${this.getUserDisplayName(orgMeterUser)} (ID: ${existingUser._id})`);
            } else {
                console.log(`No changes needed for user: ${this.getUserDisplayName(orgMeterUser)}`);
            }

            // Update or create UserFunder relationship
            await this.updateUserFunder(existingUser._id);

            return existingUser;

        } catch (error) {
            throw new Error(`Failed to update user: ${error.message}`);
        }
    }

    /**
     * Sync a syndicator user to system user
     * @param {Object} orgMeterUser - OrgMeter user document
     * @returns {Object} Sync result
     */
    async syncSyndicatorUser(orgMeterUser) {
        try {
            // If true, try to locate this user in orgMeterSyndicator with the id
            const orgMeterSyndicator = await OrgMeterSyndicator.findOne({
                id: orgMeterUser.entity.id
            });

            if (orgMeterSyndicator) {
                // Because this step can only be reached after all the syndicators are synced,
                // we can try to get the syndicator from the system by this orgMeterSyndicator's sync data
                if (orgMeterSyndicator.syncMetadata.syncId) {
                    const syncedSyndicator = await Syndicator.findById(orgMeterSyndicator.syncMetadata.syncId);
                    if (syncedSyndicator) {
                        return {
                            action: 'skipped',
                            syncedUser: syncedSyndicator,
                            message: `Skipped existing syndicator user: ${this.getUserDisplayName(orgMeterUser)}`
                        };
                    }
                }
            } 
                
            // If not found, create a new syndicator by calling function from syncOrgMeterSyndicatorService
            const syncOrgMeterSyndicatorService = new SyncOrgMeterSyndicatorService(this.funderId);
            const orgMeterSyndicatorData = {
                id: orgMeterUser.entity.id,
                name: orgMeterUser.entity.firstName + ' ' + orgMeterUser.entity.lastName,
                email: orgMeterUser.entity.email,
                deleted: !orgMeterUser.enabled
            };
            const result = await syncOrgMeterSyndicatorService.syncSyndicator(orgMeterSyndicatorData);
            return result;
        } catch (error) {
            throw new Error(`Failed to sync syndicator user ${this.getUserDisplayName(orgMeterUser)}: ${error.message}`);
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
                console.log(`UserFunder relationship already exists for user ${userId}`);
                return existingUserFunder;
            }

            const userFunderData = {
                user: userId,
                funder: this.funderId
            };

            const userFunder = new UserFunder(userFunderData);
            await userFunder.save();

            console.log(`Created UserFunder relationship: User ${userId}, Funder ${this.funderId}`);
            return userFunder;

        } catch (error) {
            console.error(`Failed to create UserFunder relationship: ${error.message}`);
            throw error;
        }
    }

    /**
     * Create UserLender relationship
     * @param {String} userId - System user ID
     * @param {String} lenderId - System lender ID
     */
    async createUserLender(userId, lenderId) {
        try {
            // Check if UserLender already exists
            const existingUserLender = await UserLender.findOne({
                user: userId,
                lender: lenderId
            });

            if (existingUserLender) {
                console.log(`UserLender relationship already exists for user ${userId} and lender ${lenderId}`);
                return existingUserLender;
            }

            const userLenderData = {
                user: userId,
                lender: lenderId
            };

            const userLender = new UserLender(userLenderData);
            await userLender.save();

            console.log(`Created UserLender relationship: User ${userId}, Lender ${lenderId}`);
            return userLender;

        } catch (error) {
            console.error(`Failed to create UserLender relationship: ${error.message}`);
            throw error;
        }
    }

    /**
     * Update UserFunder relationship
     * @param {String} userId - System user ID
     * @param {Object} orgMeterUser - OrgMeter user document
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

            // Update UserLender relationship
            // First, find out all the lenders that the user is associated with based on the orgMeterLender.importMetadata.funder
            const orgMeterLenders = await OrgMeterLender.find({
                'importMetadata.funder': this.funderId
            });
            // Then, for each lender, create a UserLender relationship
            for (const orgMeterLender of orgMeterLenders) {
                if (orgMeterLender.syncMetadata?.syncId) {
                    await this.createUserLender(userId, orgMeterLender.syncMetadata.syncId);
                }
            }

        } catch (error) {
            console.error(`Failed to update UserFunder relationship: ${error.message}`);
            throw error;
        }
    }

    /**
     * Update sync metadata for OrgMeter user
     * @param {Object} orgMeterUser - OrgMeter user document
     * @param {String} syncedUserId - ID of the synced system user
     */
    async updateSyncMetadata(orgMeterUser, syncedUserId = null) {
        try {
            const updateData = {
                'syncMetadata.lastSyncedAt': new Date(),
                'syncMetadata.lastSyncedBy': this.userId || 'system',
                'syncMetadata.type': 'user'
            };

            if (syncedUserId) {
                updateData['syncMetadata.syncId'] = syncedUserId;
                // Don't change needsSync - it remains as user's selection
            }

            // If the user is a syndicator, we need to set the type to 'syndicator'
            if (orgMeterUser.entity?.type === 'syndicator') {
                updateData['syncMetadata.type'] = 'syndicator';
            }

            await OrgMeterUser.findByIdAndUpdate(orgMeterUser._id, updateData);

        } catch (error) {
            console.error(`Failed to update sync metadata for user ${orgMeterUser.id}:`, error.message);
        }
    }

    /**
     * Mark specific OrgMeter users as needing sync
     * @param {Array} userIds - Array of OrgMeter user IDs (numeric IDs)
     * @returns {Object} Update result
     */
    async markUsersForSync(userIds) {
        try {
            const result = await OrgMeterUser.updateMany(
                {
                    id: { $in: userIds },
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
                message: `Marked ${result.nModified} users for sync`,
                modifiedCount: result.nModified
            };

        } catch (error) {
            throw new ErrorResponse(`Failed to mark users for sync: ${error.message}`, 500);
        }
    }

    /**
     * Get sync results summary
     * @returns {Object} Sync statistics
     */
    getSyncResults() {
        return {
            success: true,
            message: 'User sync completed',
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
     * Get sync status for OrgMeter users
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
                    { username: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ];
            }

            const skip = (page - 1) * limit;
            const users = await OrgMeterUser.find(query)
                .populate('syncMetadata.syncId', 'first_name last_name email')
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(limit);

            const total = await OrgMeterUser.countDocuments(query);

            // Get overall sync statistics
            const syncStats = await OrgMeterUser.aggregate([
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
                    users,
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

module.exports = SyncOrgMeterUserService;
