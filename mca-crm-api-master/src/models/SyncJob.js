const mongoose = require('mongoose');

const syncJobSchema = new mongoose.Schema({
    jobId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    entityType: {
        type: String,
        required: true,
        enum: ['lender', 'iso', 'merchant', 'syndicator', 'user', 'underwriter', 'representative', 'advance']
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
        currentEntity: {
            type: String,
            default: null
        }
    },
    parameters: {
        apiKey: {
            type: String,
            required: false // Not required for user-initiated sync jobs
        },
        funder: {
            type: String,
            required: true
        },
        updateExisting: {
            type: Boolean,
            default: true
        },
        onlySelected: {
            type: Boolean,
            default: true
        },
        dryRun: {
            type: Boolean,
            default: false
        }
    },
    results: {
        synced: {
            type: Number,
            default: 0
        },
        updated: {
            type: Number,
            default: 0
        },
        skipped: {
            type: Number,
            default: 0
        },
        failed: {
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
syncJobSchema.index({ status: 1, createdAt: -1 });
syncJobSchema.index({ entityType: 1, status: 1 });
syncJobSchema.index({ 'parameters.funder': 1, createdAt: -1 });
syncJobSchema.index({ createdAt: -1 });

// TTL index to automatically remove completed/failed jobs after 7 days
syncJobSchema.index({ 
    completedAt: 1 
}, { 
    expireAfterSeconds: 7 * 24 * 60 * 60, // 7 days
    partialFilterExpression: { 
        status: { $in: ['completed', 'failed', 'cancelled'] },
        completedAt: { $exists: true }
    }
});

// Methods
syncJobSchema.methods.updateProgress = function(processed, total, currentEntity = null) {
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

syncJobSchema.methods.markStarted = function() {
    this.status = 'running';
    this.startedAt = new Date();
    return this.save();
};

syncJobSchema.methods.markCompleted = function(results) {
    this.status = 'completed';
    this.completedAt = new Date();
    this.results = { ...this.results.toObject(), ...results };
    this.estimatedTimeRemaining = 0;
    return this.save();
};

syncJobSchema.methods.markFailed = function(error) {
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

syncJobSchema.methods.markCancelled = function() {
    this.status = 'cancelled';
    this.completedAt = new Date();
    this.estimatedTimeRemaining = 0;
    return this.save();
};

syncJobSchema.methods.resetForContinuation = function(resumeFromIndex = 0) {
    this.status = 'pending';
    this.progress.processed = resumeFromIndex;
    this.progress.percentage = 0;
    this.progress.currentEntity = null;
    this.error = null;
    this.startedAt = null;
    this.completedAt = null;
    this.estimatedTimeRemaining = null;
    this.lastProgressUpdate = new Date();
    
    // Clear previous results
    this.results = {
        synced: 0,
        updated: 0,
        skipped: 0,
        failed: 0,
        details: null
    };
    
    return this.save();
};

// Static methods
syncJobSchema.statics.createJob = function(jobData) {
    const jobId = `sync_${jobData.entityType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return this.create({
        jobId,
        ...jobData
    });
};

syncJobSchema.statics.findActiveJobs = function() {
    return this.find({
        status: { $in: ['pending', 'running'] }
    }).sort({ createdAt: -1 });
};

syncJobSchema.statics.findRecentJobs = function(limit = 10) {
    return this.find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('createdBy', 'name email');
};

syncJobSchema.statics.getJobStats = function(funder = null) {
    const matchStage = funder ? { 'parameters.funder': funder } : {};
    
    return this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);
};

module.exports = mongoose.model('Sync-Job', syncJobSchema); 