class ErrorResponse extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }

    toJSON() {
        return {
            success: false,
            message: this.message,
            statusCode: this.statusCode,
            data: null
        };
    }
}

module.exports = ErrorResponse; 