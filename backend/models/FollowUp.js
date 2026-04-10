const mongoose = require('mongoose');

const followUpSchema = new mongoose.Schema({
    case: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    scheduledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedDoctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    scheduledDate: { type: Date, required: true },
    completedAt: { type: Date },
    isCompleted: { type: Boolean, default: false },

    type: { type: String, enum: ['phone', 'telephonic', 'home_visit', 'clinic', 'visit', 'other'], default: 'home_visit' },
    notes: { type: String },
    outcome: { type: String },

    reminderSent: { type: Boolean, default: false },
    reminderSentAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('FollowUp', followUpSchema);
