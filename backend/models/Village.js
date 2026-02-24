const mongoose = require('mongoose');

const villageSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    state: { type: String, default: 'Unknown' },
    pincode: { type: String },
    population: { type: Number, default: 0 },
    households: { type: Number, default: 0 },
    panchayatOfficer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedDoctors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    primaryHealthCenter: { type: String },
    coordinates: {
        lat: { type: Number },
        lng: { type: Number },
    },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

villageSchema.index({ name: 'text', district: 'text' });

module.exports = mongoose.model('Village', villageSchema);
