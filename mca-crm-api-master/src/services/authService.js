const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const RefreshToken = require('../models/RefreshToken');
const ErrorResponse = require('../utils/errorResponse');

// Configuration
const config = {
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET || crypto.randomBytes(32).toString('hex'),
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || crypto.randomBytes(32).toString('hex'),
    accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY || '30m',     // 30 minutes
    refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY || '30d',     // 30 days
    cookieSecure: process.env.NODE_ENV === 'production', // HTTPS only in production
    cookieSameSite: 'strict'
};

/**
 * Generate access token
 * @param {string} id 
 * @param {string} portal 
 * @param {string} filter 
 * @param {string} fingerprint 
 * @returns {string} access token
 */
exports.generateAccessToken = (id, portal, role, filter, fingerprint) => {
    return jwt.sign(        
        { 
            id, 
            portal,
            role,
            filter,
            fingerprint // Include client fingerprint (ip address)
        },
        config.accessTokenSecret,
        { expiresIn: config.accessTokenExpiry }
    );
};

/**
 * Generate refresh token
 * @param {string} id 
 * @param {string} portal 
 * @param {string} filter 
 * @param {string} fingerprint 
 * @returns {string} refresh token
 */
exports.generateRefreshToken = async (id, portal, role, filter, fingerprint) => {
    // Create a unique token identifier
    const tokenId = crypto.randomBytes(32).toString('hex');
    
    const refreshToken = jwt.sign(
        { 
            id,
            portal,
            role,
            filter,
            type: 'refresh',
            tokenId, // Add unique token ID for revocation
            fingerprint // Include client fingerprint
        },
        config.refreshTokenSecret,
        { expiresIn: config.refreshTokenExpiry }
    );
    
    // Calculate expiry date
    const expiryMs = parseTokenExpiry(config.refreshTokenExpiry);
    const expiresAt = new Date(Date.now() + expiryMs);
    
    // Store the refresh token in database
    await RefreshToken.create({
        userId: id,
        tokenId,
        token: refreshToken,
        fingerprint,
        expiresAt,
        isRevoked: false
    });
    
    return refreshToken;
};

// Parse token expiry string (e.g., '30d', '15m') to milliseconds
function parseTokenExpiry(expiryString) {
    const unit = expiryString.slice(-1);
    const value = parseInt(expiryString.slice(0, -1));
    
    switch(unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return 30 * 24 * 60 * 60 * 1000; // Default to 30 days
    }
}

/**
 * Refresh access token
 * @param {string} refreshToken 
 * @param {string} fingerprint
 * @returns {string} new access token
 */
exports.refreshAccessToken = async (refreshToken, fingerprint) => {
    try {
        if (!refreshToken) {
            throw new ErrorResponse('Refresh token required', 401);
        }
      
        // Verify refresh token
        const decoded = jwt.verify(refreshToken, config.refreshTokenSecret);
        
        // Check if token has been revoked
        const storedToken = await RefreshToken.findByTokenId(decoded.tokenId);
    
        if (!storedToken) {
            throw new ErrorResponse('Refresh token not found', 403);
        }
        
        if (storedToken.isRevoked) {
            throw new ErrorResponse('Refresh token revoked', 403);
        }
    
        if (fingerprint !== decoded.fingerprint) {
            // Potential token theft! Revoke token and force re-authentication
            //await storedToken.revoke();
            //throw new ErrorResponse('Security validation failed', 403);
        }
          
        // Generate new access token
        return this.generateAccessToken(decoded.id, decoded.portal, decoded.role, decoded.filter, decoded.fingerprint);
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            throw new ErrorResponse('Invalid refresh token', 401);
        }
        
        if (error.name === 'TokenExpiredError') {
            throw new ErrorResponse('Refresh token expired', 401);
        }
        
        if (error instanceof ErrorResponse) {
            throw error;
        }
        
        throw new ErrorResponse('Authentication error', 500);
    }
};

/**
 * Verify access token
 * @param {string} accessToken 
 * @param {string} fingerprint
 * @returns {object} decoded token
 */
exports.verifyAccessToken = async (accessToken, fingerprint) => {
    try {
        const decoded = jwt.verify(accessToken, config.accessTokenSecret);

        // Check fingerprint
        if (fingerprint !== decoded.fingerprint) {
            //TODO: Uncomment this when we have a way to validate the fingerprint
            // In deployment, the access request of one user could be generated from different ip addresses
            //throw new ErrorResponse('Security validation failed', 403);
        }

        return decoded;
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            throw new ErrorResponse('Invalid access token', 401);
        }

        if (error.name === 'TokenExpiredError') {
            throw new ErrorResponse('Access token expired', 401);
        }

        if (error instanceof ErrorResponse) {
            throw error;
        }

        throw new ErrorResponse('Authentication error', 500);
    }
};

/**
 * Verify refresh token
 * @param {string} refreshToken 
 * @param {string} fingerprint
 * @returns {object} decoded token
 */
exports.verifyRefreshToken = async (refreshToken, fingerprint) => {
    try {
        const decoded = jwt.verify(refreshToken, config.refreshTokenSecret);

        // Check fingerprint
        if (fingerprint !== decoded.fingerprint) {
            //TODO: Uncomment this when we have a way to validate the fingerprint
            // In deployment, the access request of one user could be generated from different ip addresses
            //throw new ErrorResponse('Security validation failed', 403);
        }

        // Check if token has been revoked
        const storedToken = await RefreshToken.findByTokenId(decoded.tokenId);

        if (!storedToken) {
            throw new ErrorResponse('Refresh token not found', 403);
        }

        if (storedToken.isRevoked) {
            throw new ErrorResponse('Refresh token revoked', 403);
        }

        return decoded;
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            throw new ErrorResponse('Invalid refresh token', 401);
        }

        if (error.name === 'TokenExpiredError') {
            throw new ErrorResponse('Refresh token expired', 401);
        }

        if (error instanceof ErrorResponse) {
            throw error;
        }

        throw new ErrorResponse('Authentication error', 500);
    }
};

/** 
 * Revoke refresh token
 * @param {string} refreshToken 
 * @returns {void}
 */
exports.revokeRefreshToken = async (refreshToken) => {
    try {
        if (!refreshToken) {
            return;
        }
        
        try {
            const decoded = jwt.verify(refreshToken, config.refreshTokenSecret);
            
            // Find and revoke the token
            const token = await RefreshToken.findByTokenId(decoded.tokenId);
            if (token) {
                await token.revoke();
            }
        } catch (err) {
            // Token is invalid, nothing to revoke
        }
    } catch (error) {
        throw new ErrorResponse('Internal server error', 500);
    }
};

/**
 * Revoke all user tokens
 * @param {string} userId 
 * @returns {object} success
 */
exports.revokeAllUserTokens = async (userId) => {
    try {
        await RefreshToken.revokeAllUserTokens(userId);
        return { success: true };
    } catch (error) {
        throw new ErrorResponse('Failed to revoke tokens', 500);
    }
};