const mongoose = require('mongoose');

const diagnosisSchema = new mongoose.Schema({
    case: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // senior doctor
    report: { type: mongoose.Schema.Types.ObjectId, ref: 'DoctorReport' },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },

    finalDiagnosis: { type: String, required: true },
    icdCode: { type: String }, // ICD-10 code
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical', 'mild', 'moderate', 'severe'] },

    prescription: [{
        medicine: { type: String },
        dosage: { type: String },
        frequency: { type: String },
        duration: { type: String },
        route: { type: String, enum: ['oral', 'topical', 'injection', 'inhaled', 'sublingual', 'intravenous', 'intramuscular', 'rectal', 'other', 'Oral', 'Topical', 'Injection', 'Inhaled', 'Sublingual', 'Intravenous', 'Intramuscular', 'Rectal', 'Other'] },
    }],

    testsRequired: [{ type: String }],
    testResults: [{
        testName: { type: String },
        result: { type: String },
        date: { type: Date },
        fileUrl: { type: String },
    }],

    treatmentPlan: { type: String },
    dietaryAdvice: { type: String },
    referralRequired: { type: Boolean, default: false },
    referralTo: { type: String },
    hospitalizationRequired: { type: Boolean, default: false },

    notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Diagnosis', diagnosisSchema);
