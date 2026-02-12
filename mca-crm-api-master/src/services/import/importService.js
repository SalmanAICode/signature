const csv = require('csv-parse');
const { Readable } = require('stream');
const ErrorResponse = require('../../utils/errorResponse');

/**
 * Process CSV file and return parsed data
 * @param {Object} file - The uploaded file object
 * @returns {Promise<Array>} - Array of parsed CSV records
 */
exports.processCSV = async (file) => {
    if (!file || !file.buffer) {
        throw new ErrorResponse('Invalid file object', 400);
    }

    return new Promise((resolve, reject) => {
        const records = [];
        const parser = csv.parse({
            columns: true,
            skip_empty_lines: true,
            trim: true,
            quote: '"',
            escape: '"',
            relax_quotes: true,
            relax_column_count: true,
            delimiter: ',',
            from_line: 1,
            skip_records_with_empty_values: false,
            skip_records_with_error: false
        });

        parser.on('readable', () => {
            let record;
            while ((record = parser.read()) !== null) {
                records.push(record);
            }
        });

        parser.on('error', (err) => {
            reject(new ErrorResponse(`Error parsing CSV: ${err.message}`, 400));
        });

        parser.on('end', () => {
            resolve(records);
        });

        // Create a readable stream from the buffer
        const stream = Readable.from(file.buffer);
        stream.pipe(parser);
    });
};

/**
 * Parse amount and count from string like "$719500.00 (3)"
 * @param {string} str - The string to parse
 * @returns {Object} - Object containing amount and count
 */
exports.parseAmountAndCount = (str) => {
    if (!str) return { amount: 0, count: 0 };
    const match = str.match(/\$([\d,]+\.\d+)\s*\((\d+)\)/);
    if (match) {
        return {
            amount: parseFloat(match[1].replace(/,/g, '')),
            count: parseInt(match[2], 10)
        };
    }
    return { amount: 0, count: 0 };
};

/**
 * Parse percentage from string like "33.69%"
 * @param {string} str - The string to parse
 * @returns {number} - The parsed percentage
 */
exports.parsePercentage = (str) => {
    if (!str) return 0;
    const match = str.match(/([\d.]+)%/);
    return match ? parseFloat(match[1])/100 : 0;
};

/**
 * Parse currency amount from string like "$719,500.00" or "-$1,234.56"
 * Notice that the amount is in dollars, we will multiply by 100 to get the cents value
 * @param {string} str - The string to parse
 * @returns {number} - The parsed amount
 */
exports.parseCurrency = (str) => {
    if (!str) return 0;
    const match = str.match(/-?\$([\d,]+\.\d+)/);
    if (!match) return 0;
    const value = Math.round(parseFloat(match[1].replace(/,/g, ''))*100);
    return str.startsWith('-') ? -value : value;
};

/**
 * Parse date from string like "2025-06-09"
 * @param {string} str - The string to parse
 * @returns {Date} - The parsed date
 */
exports.parseDate = (str) => {
    if (!str) return null;
    return new Date(str);
};

/**
 * Parse boolean from string like "Yes" or "No", "True" or "False", "1" or "0"
 * @param {string} str - The string to parse
 * @returns {boolean} - The parsed boolean
 */
exports.parseBoolean = (str) => {
    if (!str) return false;
    return str.toLowerCase() === 'true' || str === '1' || str === 'yes' || str === 'y';
};

/**
 * Validate CSV file headers
 * @param {Object} file - The uploaded file object
 * @param {Array} requiredHeaders - Array of required header names
 * @returns {Promise<Object>} - Validation result
 */
exports.validateCSVHeaders = async (file, requiredHeaders) => {
    if (!file || !file.buffer) {
        throw new ErrorResponse('Invalid file object', 400);
    }

    console.log('Starting header validation:', {
        requiredHeaders,
        bufferLength: file.buffer.length,
        preview: file.buffer.toString('utf8').substring(0, 200)
    });

    return new Promise((resolve, reject) => {
        const parser = csv.parse({
            columns: true,
            skip_empty_lines: true,
            trim: true,
            quote: '"',
            escape: '"',
            relax_quotes: true,
            relax_column_count: true,
            delimiter: ',',
            from_line: 1,
            skip_records_with_empty_values: false,
            skip_records_with_error: false
        });

        let headers = null;

        parser.on('readable', () => {
            const record = parser.read();
            if (record && !headers) {
                headers = Object.keys(record);
                console.log('Found headers:', headers);
                const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
                
                if (missingHeaders.length > 0) {
                    console.log('Missing headers:', missingHeaders);
                    reject(new ErrorResponse(`Missing required headers: ${missingHeaders.join(', ')}`, 400));
                } else {
                    console.log('All required headers found');
                    resolve({ isValid: true });
                }
            }
        });

        parser.on('error', (err) => {
            console.error('Header validation error:', err);
            reject(new ErrorResponse(`Error parsing CSV: ${err.message}`, 400));
        });

        parser.on('end', () => {
            if (!headers) {
                console.log('No headers found in file');
                reject(new ErrorResponse('No headers found in CSV file', 400));
            }
        });

        // Create a readable stream from the buffer
        const stream = Readable.from(file.buffer);
        stream.pipe(parser);
    });
}; 