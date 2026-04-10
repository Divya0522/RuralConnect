const express = require('express');
const router = express.Router();
const DoctorReport = require('../models/DoctorReport');
const Case = require('../models/Case');
const protect = require('../middleware/auth');
const authorize = require('../middleware/roles');
const upload = require('../middleware/upload');
const Notification = require('../models/Notification');
const Patient = require('../models/Patient');
const { createLog } = require('../utils/logger');

// GET /api/reports - list reports
router.get('/', protect, authorize('junior_doctor', 'senior_doctor', 'admin'), async (req, res, next) => {
    try {
        const { caseId, doctor, page = 1, limit = 20 } = req.query;
        const query = {};
        if (caseId) query.case = caseId;
        if (doctor) query.doctor = doctor;
        if (req.user.role === 'junior_doctor') query.doctor = req.user._id;

        const reports = await DoctorReport.find(query)
            .populate('case', 'caseId chiefComplaint status')
            .populate('doctor', 'name role')
            .populate('patient', 'name age gender')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));
        const total = await DoctorReport.countDocuments(query);
        res.json({ success: true, data: reports, total });
    } catch (err) { next(err); }
});

// GET /api/reports/:id
router.get('/:id', protect, async (req, res, next) => {
    try {
        const report = await DoctorReport.findById(req.params.id)
            .populate('case')
            .populate('doctor', 'name role qualification')
            .populate('patient', 'name age gender bloodGroup allergies chronicConditions');
        if (!report) return res.status(404).json({ success: false, error: 'Report not found.' });
        res.json({ success: true, data: report });
    } catch (err) { next(err); }
});

// POST /api/reports - junior doctor submits visit report
router.post('/', protect, authorize('junior_doctor'), (req, res, next) => { req.uploadFolder = 'reports'; next(); }, upload.array('reportImages', 5), async (req, res, next) => {
    try {
        const reportImages = req.files ? req.files.map(f => f.path) : [];
        const medicines = req.body.medicinesPrescribed ? JSON.parse(req.body.medicinesPrescribed) : [];
        const caseDoc_ref = await Case.findById(req.body.case).select('caseId');
        const caseId_str = caseDoc_ref ? caseDoc_ref.caseId : 'Unknown';

        const report = await DoctorReport.create({
            ...req.body,
            vitals: req.body.vitals ? JSON.parse(req.body.vitals) : {},
            medicinesPrescribed: medicines,
            testsOrdered: req.body.testsOrdered ? req.body.testsOrdered.split(',').map(t => t.trim()) : [],
            reportImages,
            doctor: req.user._id,
        });

        // Update case status
        const newStatus = req.body.status || 'visited';
        await Case.findByIdAndUpdate(req.body.case, {
            status: newStatus,
            $push: { statusHistory: { status: newStatus, changedBy: req.user._id } },
        });

        // Notify patient
        const patientDoc = await Patient.findById(req.body.patient).select('user');
        if (patientDoc && patientDoc.user) {
            await Notification.create({
                recipient: patientDoc.user,
                sender: req.user._id,
                type: 'diagnosis_ready',
                title: '[PATIENT] Medical Report Ready',
                targetRole: 'patient',
                message: `Your medical report for case ${caseId_str} has been submitted by Dr. ${req.user.name}.`,
                relatedCase: req.body.case,
            });
        }

        await createLog({ actor: req.user, action: 'CREATE_REPORT', module: 'reports', targetId: report._id, targetModel: 'DoctorReport', ipAddress: req.ip });
        res.status(201).json({ success: true, data: report });
    } catch (err) { next(err); }
});

// PUT /api/reports/:id
router.put('/:id', protect, authorize('junior_doctor', 'admin'), async (req, res, next) => {
    try {
        const report = await DoctorReport.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!report) return res.status(404).json({ success: false, error: 'Report not found.' });
        await createLog({ actor: req.user, action: 'UPDATE_REPORT', module: 'reports', targetId: report._id, targetModel: 'DoctorReport', ipAddress: req.ip });
        res.json({ success: true, data: report });
    } catch (err) { next(err); }
});

module.exports = router;
