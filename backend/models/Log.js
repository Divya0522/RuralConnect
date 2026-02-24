const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    actorName: { type: String },
    actorRole: { type: String },
    action: { type: String, required: true }, // e.g. 'CREATE_CASE', 'UPDATE_STATUS', 'LOGIN'
    module: { type: String }, // 'auth', 'case', 'user', etc.
    targetId: { type: mongoose.Schema.Types.ObjectId },
    targetModel: { type: String }, // 'Case', 'User', etc.
    description: { type: String },
    ipAddress: { type: String },
    userAgent: { type: String },
    status: { type: String, enum: ['success', 'failure'], default: 'success' },
    meta: { type: mongoose.Schema.Types.Mixed }, // extra data
}, { timestamps: true });

logSchema.index({ actor: 1, action: 1, createdAt: -1 });

module.exports = mongoose.model('Log', logSchema);
