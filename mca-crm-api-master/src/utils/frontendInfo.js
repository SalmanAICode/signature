const crypto = require('crypto');

/**
 * Get the client's IP address from the request
 * @param {Object} req - Express request object
 * @returns {String} - Client's IP address
 */
const getClientIp = (req) => {
    // OPTION 1: Simplest - just use Express built-in (requires app.set('trust proxy', true))
    return req.ip;

    // OPTION 2: Simple fallback to connection remote address
    // return req.connection.remoteAddress || req.socket.remoteAddress || '0.0.0.0';

    // OPTION 3: Just get first forwarded IP (common for load balancers)
    // return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.connection.remoteAddress || '0.0.0.0';

    // OPTION 4: If IP consistency isn't critical, return a static identifier
    // return 'client-' + Date.now();

    // OPTION 5: Current complex implementation (original)
    /*const ip = (req.headers['x-forwarded-for'] || '').split(',').pop().trim() || 
               req.headers['x-real-ip'] || 
               req.connection.remoteAddress || 
               req.socket.remoteAddress ||
               req.connection.socket?.remoteAddress;

    // If IP is IPv6, convert it to IPv4 if possible
    if (ip.includes('::ffff:')) {
        return ip.split('::ffff:')[1];
    }

    return ip;*/
};

/**
 * Get the client's user agent from the request
 * @param {Object} req - Express request object
 * @returns {String} - Client's user agent
 */
const getClientUserAgent = (req) => {
    return req.headers['user-agent'] || '';
};

/**
 * Get the client's fingerprint from the request
 * @param {Object} req - Express request object
 * @returns {String} - Client's fingerprint
 */
const getFingerprint = (req) => {
    const clientIp = getClientIp(req);
    const userAgent = getClientUserAgent(req);
    const fingerprint = crypto.createHash('sha256').update(`${clientIp}:${userAgent}`).digest('hex');
    return fingerprint;
};

module.exports = { getClientIp, getClientUserAgent, getFingerprint }; 