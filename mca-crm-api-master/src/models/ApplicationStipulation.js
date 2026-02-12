const mongoose = require('mongoose');
const { APPLICATION_STIPULATION_STATUS } = require('../utils/constants');

const ApplicationStipulationSchema = new mongoose.Schema({
    application: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Application',
        required: true,
        index: true
    },
    stipulation_type: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Stipulation-Type',
            index: true
        },
        name: { type: String, index: true },
        required: { type: Boolean, index: true },
        _id: false
    },
    status: {
        type: String,
        enum: Object.values(APPLICATION_STIPULATION_STATUS),
        default: APPLICATION_STIPULATION_STATUS.REQUESTED,
        index: true
    },
    status_date: {
        type: Date,
        required: true,
        default: Date.now
    },
    status_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    note: {
        type: String
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Pre-save middleware to update status_date when status changes
ApplicationStipulationSchema.pre('save', function(next) {
    if (this.isModified('status') && !this.isNew) {
        this.status_date = new Date();
    }
    next();
});

// Pre-update middleware to update status_date when status changes via findOneAndUpdate, updateOne, etc.
ApplicationStipulationSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function(next) {
    const update = this.getUpdate();
    if (update && (update.status || (update.$set && update.$set.status))) {
        if (!update.$set) update.$set = {};
        update.$set.status_date = new Date();
    }
    next();
});
/*
// Virtual field of document_count
ApplicationStipulationSchema.virtual('document_count', {
    ref: 'Application-Document',
    localField: '_id',
    foreignField: 'application_stipulation',
    count: true
});

// Virtual field of document_list
ApplicationStipulationSchema.virtual('document_list', {
    ref: 'Application-Document',
    localField: '_id',
    foreignField: 'application_stipulation',
    options: {
        select: 'document -application_stipulation -_id'
    },
    transform: function(doc, ret) {
        return {
            id: ret.document.id,
            file_name: ret.document.file_name,
            file_type: ret.document.file_type,
            file_size: ret.document.file_size
        };
    }
});

// Virtual field of latest_upload, this is the newest document in application-document collection with same stipulation
ApplicationStipulationSchema.virtual('latest_upload', {
    ref: 'Application-Document',
    localField: '_id',
    foreignField: 'application_stipulation',
    options: {
        sort: {
            'createdAt': -1
        },
        select: 'createdAt -application_stipulation -_id'
    },
    justOne: true
});
*/


// Helper function to calculate statistics for Application-Stipulation documents
const calculateStatistics = async function(docs) {
    if (!docs || docs.length === 0) return;
    
    const ApplicationDocument = mongoose.model('Application-Document');
    
    // Get all application stipulation IDs
    const stipulationIds = docs.map(doc => doc._id);
    
    // Fetch all application documents for these stipulations in one query
    const applicationDocuments = await ApplicationDocument.find({
        application_stipulation: { $in: stipulationIds }
    });
    
    // Group application documents by stipulation ID and calculate statistics
    const statsByStipulation = {};

    // Initialize stats for each stipulation to make sure we have stats for all stipulations, even if there are no application documents for that stipulation
    for (const stipulationId of stipulationIds) {
        statsByStipulation[stipulationId] = {
            document_count: 0,
            document_list: [],
            latest_upload: null
        };
    }

    applicationDocuments.forEach(applicationDocument => {
        const stipulationId = applicationDocument.application_stipulation.toString();
        
        const stats = statsByStipulation[stipulationId];
        if (stats) {
            stats.document_count += 1;
            stats.document_list.push(applicationDocument.document);
            if (!stats.latest_upload || applicationDocument.createdAt > stats.latest_upload) {
                stats.latest_upload = applicationDocument.createdAt;
            }
        }
    });
    
    // Add calculated fields to each document
    docs.forEach(doc => {
        const stipulationId = doc._id.toString();
        const stats = statsByStipulation[stipulationId];
        
        doc.document_count = stats.document_count;
        doc.document_list = stats.document_list;
        doc.latest_upload = stats.latest_upload;
                
        // Set a flag to indicate that statistics have been calculated
        doc._calculatedStatsComplete = true;
    });

    return docs;
};

// Middleware to automatically add statistics to query results
ApplicationStipulationSchema.post('find', async function(docs) {
    if (this.getOptions()?.calculate) {
        await calculateStatistics(docs);
    }
});

ApplicationStipulationSchema.post('findOne', async function(doc) {
    if (doc && this.getOptions()?.calculate) {
        await calculateStatistics([doc]);
    }
});


const ApplicationStipulation = mongoose.model('Application-Stipulation', ApplicationStipulationSchema);

module.exports = ApplicationStipulation; 