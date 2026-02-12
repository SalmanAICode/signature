const mongoose = require('mongoose');

const importJobSchema = new mongoose.Schema({
    jobId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    entityType: {
        type: String,
        required: true,
        enum: ['user', 'lender', 'iso', 'merchant', 'syndicator', 'advance']
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'running', 'completed', 'failed', 'cancelled', 'paused'],
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
        currentEntity: {
            type: String,
            default: null
        }
    },
    parameters: {
        apiKey: {
            type: String,
            required: true
        },
        funder: {
            type: String,
            required: true
        },
        batchSize: {
            type: Number,
            default: 20
        },
        updateExisting: {
            type: Boolean,
            default: true
        }
    },
    results: {
        imported: {
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
    pausedAt: {
        type: Date,
        default: null
    },
    resumeData: {
        resumeFrom: {
            type: String,
            enum: ['current', 'beginning'],
            default: 'current'
        },
        lastProcessedId: {
            type: String,
            default: null
        },
        bookmarkData: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        }
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
importJobSchema.index({ status: 1, createdAt: -1 });
importJobSchema.index({ entityType: 1, status: 1 });
importJobSchema.index({ 'parameters.funder': 1, createdAt: -1 });
importJobSchema.index({ createdAt: -1 });

// TTL index to automatically remove completed/failed jobs after 7 days
importJobSchema.index({ 
    completedAt: 1 
}, { 
    expireAfterSeconds: 7 * 24 * 60 * 60, // 7 days
    partialFilterExpression: { 
        status: { $in: ['completed', 'failed', 'cancelled'] },
        completedAt: { $exists: true }
    }
});

// Methods
importJobSchema.methods.updateProgress = function(processed, total, currentEntity = null) {
    this.progress.processed = processed;
    this.progress.total = total;
    this.progress.percentage = total > 0 ? Math.round((processed / total) * 100) : 0;
    this.progress.currentEntity = currentEntity;
    this.lastProgressUpdate = new Date();
    
    // Calculate estimated time remaining
    if (processed > 0 && this.startedAt) {
        const elapsed = Date.now() - this.startedAt.getTime();
        const rate = processed / elapsed; // entities per millisecond
        const remaining = total - processed;
        this.estimatedTimeRemaining = remaining > 0 ? Math.round(remaining / rate) : 0;
    }
    
    return this.save();
};

importJobSchema.methods.markStarted = function() {
    this.status = 'running';
    this.startedAt = new Date();
    return this.save();
};

importJobSchema.methods.markCompleted = function(results) {
    this.status = 'completed';
    this.completedAt = new Date();
    this.results = { ...this.results.toObject(), ...results };
    this.estimatedTimeRemaining = 0;
    return this.save();
};

importJobSchema.methods.markFailed = function(error) {
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

importJobSchema.methods.markCancelled = function() {
    this.status = 'cancelled';
    this.completedAt = new Date();
    this.estimatedTimeRemaining = 0;
    return this.save();
};

importJobSchema.methods.markPaused = function(bookmarkData = null) {
    this.status = 'paused';
    this.pausedAt = new Date();
    if (bookmarkData) {
        this.resumeData.bookmarkData = bookmarkData;
        this.resumeData.lastProcessedId = bookmarkData.lastProcessedId || null;
    }
    return this.save();
};

importJobSchema.methods.markResumed = function(resumeFrom = 'current', updatedParameters = null) {
    this.status = 'running';
    this.resumeData.resumeFrom = resumeFrom;
    this.pausedAt = null;
    
    // Update parameters if provided
    if (updatedParameters) {
        if (updatedParameters.batchSize) {
            this.parameters.batchSize = updatedParameters.batchSize;
        }
        if (typeof updatedParameters.updateExisting === 'boolean') {
            this.parameters.updateExisting = updatedParameters.updateExisting;
        }
    }
    
    // Reset progress if resuming from beginning
    if (resumeFrom === 'beginning') {
        this.progress.processed = 0;
        this.progress.percentage = 0;
        this.progress.currentEntity = null;
        this.results.imported = 0;
        this.results.updated = 0;
        this.results.errors = 0;
        this.results.skipped = 0;
        this.resumeData.lastProcessedId = null;
        this.resumeData.bookmarkData = null;
    }
    
    return this.save();
};

// Static methods
importJobSchema.statics.createJob = function(jobData) {
    const jobId = `import_${jobData.entityType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return this.create({
        jobId,
        ...jobData
    });
};

importJobSchema.statics.findActiveJobs = function() {
    return this.find({
        status: { $in: ['pending', 'running', 'paused'] }
    }).sort({ createdAt: -1 });
};

importJobSchema.statics.findPausedJobs = function(funder = null, entityTypes = null) {
    let query = { status: 'paused' };
    
    if (funder) {
        query['parameters.funder'] = funder;
    }
    
    if (entityTypes && entityTypes.length > 0) {
        query.entityType = { $in: entityTypes };
    }
    
    return this.find(query).sort({ pausedAt: -1 });
};

importJobSchema.statics.findJobsByFunder = function(funder, limit = 20) {
    return this.find({
        'parameters.funder': funder
    })
        .sort({ createdAt: -1 })
        .limit(limit);
};

importJobSchema.statics.getJobStats = function() {
    return this.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);
};

module.exports = mongoose.model('Import-Job', importJobSchema); 