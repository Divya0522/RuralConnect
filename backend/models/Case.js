const mongoose = require('mongoose');

const CASE_STATUSES = ['DRAFT', 'NEW', 'ASSIGNED', 'DIAGNOSED', 'FOLLOWUP', 'ESCALATED', 'SPECIALIST_REVIEW', 'RESOLVED', 'CLOSED'];

const caseSchema = new mongoose.Schema({
    caseId: { type: String, unique: true }, // auto-generated e.g. RHC-2024-0001

    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    village: { type: mongoose.Schema.Types.ObjectId, ref: 'Village' },
    villageName: { type: String },
    pincode: { type: String },
    district: { type: String },
    state: { type: String },

    // Complaint
    chiefComplaint: { type: String, required: true },
    symptoms: [{ type: String }],
    symptomImages: [{ type: String }], // file paths
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    notes: { type: String },

    // Assignment
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // junior/senior doctor
    assignedDoctorRole: { type: String, enum: ['junior_doctor', 'senior_doctor'] },
    assignedAt: { type: Date },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdByHelperId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Status workflow
    status: { type: String, enum: CASE_STATUSES, default: 'NEW' },
    statusHistory: [{
        status: { type: String, enum: CASE_STATUSES },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changedAt: { type: Date, default: Date.now },
        note: { type: String },
    }],

    caseType: { type: String, enum: ['normal', 'serious'], default: 'normal' },
    // FIXED: removed duplicate `priority` — use `severity` consistently
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    tags: [{ type: String }],

    // Senior review
    seniorReviewRequested: { type: Boolean, default: false },
    seniorReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Resolution
    resolvedAt: { type: Date },
    closedAt: { type: Date },
    closureNote: { type: String },
}, { timestamps: true });

// Auto-generate caseId
caseSchema.pre('save', async function (next) {
    if (this.isNew && !this.caseId) {
        const count = await mongoose.model('Case').countDocuments();
        const year = new Date().getFullYear();
        this.caseId = `RHC-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    next();
});

caseSchema.index({ status: 1, village: 1, patient: 1, assignedTo: 1 });
caseSchema.index({ chiefComplaint: 'text' });

module.exports = mongoose.model('Case', caseSchema);
