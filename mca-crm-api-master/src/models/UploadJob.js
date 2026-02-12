const mongoose = require('mongoose');

const uploadJobSchema = new mongoose.Schema({
    jobId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    entityType: {
        type: String,
        required: true,
        enum: ['payment', 'transaction'] // Can extend later for other types
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'running', 'completed', 'failed', 'cancelled'],
        default: 'pending'
    },
    progress: {
        total: {
            type: Number,
            default: 0
        },
        processed: {
            type: Number,
            default: 0
        },
        percentage: {
            type: Number,
            default: 0
        },
        currentRecord: {
            type: Number,
            default: null
        }
    },
    parameters: {
        funder: {
            type: String,
            required: true
        },
        fileName: {
            type: String,
            required: true
        },
        fieldMappings: {
            type: mongoose.Schema.Types.Mixed,
            required: true
        },
        columnIndexes: {
            type: mongoose.Schema.Types.Mixed,
            required: true
        },
        skipFirstRow: {
            type: Boolean,
            default: true
        }
    },
    uploadData: {
        fileSize: {
            type: Number,
            default: 0
        },
        totalRows: {
            type: Number,
            default: 0
        },
        csvData: {
            type: [mongoose.Schema.Types.Mixed],
            default: []
        }
    },
    results: {
        created: {
            type: Number,
            default: 0
        },
        updated: {
            type: Number,
            default: 0
        },
        errors: {
            type: Number,
            default: 0
        },
        skipped: {
            type: Number,
            default: 0
        },
        details: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        },
        errorDetails: {
            type: [mongoose.Schema.Types.Mixed],
            default: []
        }
    },
    error: {
        message: {
            type: String,
            default: null
        },
        stack: {
            type: String,
            default: null
        },
        timestamp: {
            type: Date,
            default: null
        }
    },
    startedAt: {
        type: Date,
        default: null
    },
    completedAt: {
        type: Date,
        default: null
    },
    estimatedTimeRemaining: {
        type: Number, // in milliseconds
        default: null
    },
    lastProgressUpdate: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    }
}, {
    timestamps: true,
    versionKey: false
});

// Indexes for efficient querying
uploadJobSchema.index({ status: 1, createdAt: -1 });
uploadJobSchema.index({ entityType: 1, status: 1 });
uploadJobSchema.index({ 'parameters.funder': 1, createdAt: -1 });
uploadJobSchema.index({ createdAt: -1 });

// TTL index to automatically remove completed/failed jobs after 7 days
uploadJobSchema.index({ 
    completedAt: 1 
}, { 
    expireAfterSeconds: 7 * 24 * 60 * 60, // 7 days
    partialFilterExpression: { 
        status: { $in: ['completed', 'failed', 'cancelled'] },
        completedAt: { $exists: true }
    }
});

// Methods
uploadJobSchema.methods.updateProgress = function(processed, total, currentRecord = null) {
    this.progress.processed = processed;
    this.progress.total = total;
    this.progress.percentage = total > 0 ? Math.round((processed / total) * 100) : 0;
    this.progress.currentRecord = currentRecord;
    this.lastProgressUpdate = new Date();
    
    // Calculate estimated time remaining
    if (processed > 0 && this.startedAt) {
        const elapsed = Date.now() - this.startedAt.getTime();
        const rate = processed / elapsed; // records per millisecond
        const remaining = total - processed;
        this.estimatedTimeRemaining = remaining > 0 ? Math.round(remaining / rate) : 0;
    }
    
    return this.save();
};

uploadJobSchema.methods.markStarted = function() {
    this.status = 'running';
    this.startedAt = new Date();
    return this.save();
};

uploadJobSchema.methods.markCompleted = function(results) {
    this.status = 'completed';
    this.completedAt = new Date();
    this.results = { ...this.results.toObject(), ...results };
    this.estimatedTimeRemaining = 0;
    return this.save();
};

uploadJobSchema.methods.markFailed = function(error) {
    this.status = 'failed';
    this.completedAt = new Date();
    this.error = {
        message: error.message,
        stack: error.stack,
        timestamp: new Date()
    };
    this.estimatedTimeRemaining = 0;
    return this.save();
};

uploadJobSchema.methods.markCancelled = function() {
    this.status = 'cancelled';
    this.completedAt = new Date();
    this.estimatedTimeRemaining = 0;
    return this.save();
};

uploadJobSchema.methods.addErrorDetail = function(rowIndex, error, rowData = null) {
    this.results.errorDetails.push({
        rowIndex,
        error: error.message || error,
        timestamp: new Date(),
        rowData
    });
    return this.save();
};

// Static methods
uploadJobSchema.statics.createJob = function(jobData) {
    const jobId = `upload_${jobData.entityType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return this.create({
        jobId,
        ...jobData
    });
};

uploadJobSchema.statics.findActiveJobs = function(funder = null) {
    const query = { status: { $in: ['pending', 'running'] } };
    if (funder) {
        query['parameters.funder'] = funder;
    }
    return this.find(query).sort({ createdAt: -1 });
};

const UploadJob = mongoose.model('UploadJob', uploadJobSchema);

module.exports = UploadJob; 