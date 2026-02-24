const mongoose = require('mongoose');

const doctorReportSchema = new mongoose.Schema({
    case: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },

    visitDate: { type: Date, default: Date.now },
    visitType: { type: String, enum: ['initial', 'followup', 'urgent'], default: 'initial' },

    // Vitals
    vitals: {
        temperature: { type: Number }, // Celsius
        bloodPressure: { type: String }, // "120/80"
        pulse: { type: Number },        // bpm
        respiratoryRate: { type: Number },
        oxygenSaturation: { type: Number }, // %
        weight: { type: Number },       // kg
        height: { type: Number },       // cm
        bloodSugar: { type: Number },   // mg/dL
    },

    clinicalNotes: { type: String },
    provisionalDiagnosis: { type: String },
    treatmentGiven: { type: String },
    medicinesPrescribed: [{
        name: { type: String },
        dosage: { type: String },
        duration: { type: String },
        instructions: { type: String },
    }],
    testsOrdered: [{ type: String }],
    reportImages: [{ type: String }],

    seniorReviewRequested: { type: Boolean, default: false },
    seniorReviewReason: { type: String },

    nextVisitDate: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('DoctorReport', doctorReportSchema);
