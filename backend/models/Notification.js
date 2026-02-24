const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: {
        type: String,
        enum: ['case_assigned', 'case_updated', 'review_requested', 'follow_up', 'diagnosis_ready', 'system', 'alert'],
        default: 'system',
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String }, // deep link to case/patient
    relatedCase: { type: mongoose.Schema.Types.ObjectId, ref: 'Case' },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
}, { timestamps: true });

notificationSchema.index({ recipient: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
