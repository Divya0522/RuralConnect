const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: {
        type: String,
        enum: ['case_assigned', 'diagnosis_added', 'case_escalated', 'followup_scheduled', 'case_closed', 'system', 'alert'],
        default: 'system',
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    targetRole: { type: String, enum: ['patient', 'junior_doctor', 'senior_doctor', 'admin', 'helpline_operator'] },
    link: { type: String }, // deep link to case/patient
    relatedCase: { type: mongoose.Schema.Types.ObjectId, ref: 'Case' },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
}, { timestamps: true });

notificationSchema.index({ recipient: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
