const mongoose = require('mongoose');

/**
 * RefreshToken Schema
 * Stores refresh tokens with user identity and revocation information
 */
const RefreshTokenSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId, 
        required: true,
        index: true
    },
    tokenId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    token: {
        type: String,
        required: true
    },
    fingerprint: {
        type: String,
        required: true
    },
    isRevoked: {
        type: Boolean,
        default: false,
        index: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    revokedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Index for expired token cleanup
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Add method to revoke token
RefreshTokenSchema.methods.revoke = function() {
    this.isRevoked = true;
    this.revokedAt = new Date();
    return this.save();
};

// Check if token is valid (not expired and not revoked)
RefreshTokenSchema.methods.isValid = function() {
    return !this.isRevoked && this.expiresAt > new Date();
};

// Static method to find token by tokenId
RefreshTokenSchema.statics.findByTokenId = function(tokenId) {
    return this.findOne({ tokenId, isRevoked: false });
};

// Static method to find all active tokens for a user
RefreshTokenSchema.statics.findActiveTokensForUser = function(userId) {
    return this.find({ 
        userId,
        isRevoked: false,
        expiresAt: { $gt: new Date() }
    });
};

// Static method to revoke all tokens for a user (for logout all devices)
RefreshTokenSchema.statics.revokeAllUserTokens = function(userId) {
    return this.updateMany(
        { userId, isRevoked: false },
        { isRevoked: true, revokedAt: new Date() }
    );
};

module.exports = mongoose.model('Refresh-Token', RefreshTokenSchema);
