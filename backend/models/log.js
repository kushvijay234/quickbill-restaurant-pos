const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
    level: {
        type: String,
        enum: ['info', 'warn', 'error'],
        required: true,
        index: true
    },
    message: {
        type: String,
        required: true,
    },
    source: {
        type: String,
        enum: ['web', 'mobile', 'backend', 'system'],
        default: 'web',
        index: true
    },
    platform: {
        type: String,
        default: ''
    },
    endpoint: {
        type: String,
        default: ''
    },
    statusCode: {
        type: Number,
    },
    stack: {
        type: String,
        default: ''
    },
    tenantSlug: {
        type: String,
        default: '',
        index: true
    },
    meta: {
        type: mongoose.Schema.Types.Mixed,
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
        index: true
    }
},
{
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function (doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
        }
    },
    toObject: {
        virtuals: true,
        transform: function (doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
        }
    }
});

const LogModel = mongoose.models.Log || mongoose.model('Log', LogSchema);
module.exports = LogModel;
module.exports.LogSchema = LogSchema;