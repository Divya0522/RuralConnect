const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true, trim: true },
    age: { type: Number },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    phone: { type: String, trim: true },
    address: { type: String },
    village: { type: mongoose.Schema.Types.ObjectId, ref: 'Village' },
    aadhaar: { type: String },
    bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'] },
    allergies: [{ type: String }],
    chronicConditions: [{ type: String }],
    emergencyContact: {
        name: { type: String },
        phone: { type: String },
        relation: { type: String },
    },
    registeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // helpline operator / admin
}, { timestamps: true });

patientSchema.index({ name: 'text', phone: 'text' });

module.exports = mongoose.model('Patient', patientSchema);
