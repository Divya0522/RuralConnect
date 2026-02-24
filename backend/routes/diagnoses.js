const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Diagnosis = require('../models/Diagnosis');
const Case = require('../models/Case');
const Notification = require('../models/Notification');
const protect = require('../middleware/auth');
const authorize = require('../middleware/roles');
const { createLog } = require('../utils/logger');

// GET /api/diagnoses
router.get('/', protect, authorize('senior_doctor', 'admin', 'junior_doctor', 'patient'), async (req, res, next) => {
    try {
        const { caseId, page = 1, limit = 20 } = req.query;
        const query = {};
        if (caseId) query.case = caseId;

        // Strict role-based filtering
        if (req.user.role === 'senior_doctor') {
            query.doctor = req.user._id;
        } else if (req.user.role === 'patient') {
            query.patient = req.user._id;
        }

        const diagnoses = await Diagnosis.find(query)
            .populate('case', 'caseId chiefComplaint status')
            .populate('doctor', 'name role qualification')
            .populate('patient', 'name age gender')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));
        const total = await Diagnosis.countDocuments(query);
        res.json({ success: true, data: diagnoses, total });
    } catch (err) { next(err); }
});

// GET /api/diagnoses/:id
router.get('/:id', protect, async (req, res, next) => {
    try {
        const diagnosis = await Diagnosis.findById(req.params.id)
            .populate('case')
            .populate('doctor', 'name role qualification')
            .populate('patient');
        if (!diagnosis) return res.status(404).json({ success: false, error: 'Diagnosis not found.' });
        res.json({ success: true, data: diagnosis });
    } catch (err) { next(err); }
});

// POST /api/diagnoses - senior doctor creates diagnosis
router.post('/', protect, authorize('senior_doctor'), [
    body('case').notEmpty(),
    body('patient').notEmpty(),
    body('finalDiagnosis').notEmpty().trim(),
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        const diagnosis = await Diagnosis.create({ ...req.body, doctor: req.user._id });

        // Update case status to 'reviewed'
        const caseDoc = await Case.findByIdAndUpdate(req.body.case, {
            status: 'reviewed',
            seniorReviewedBy: req.user._id,
            $push: { statusHistory: { status: 'reviewed', changedBy: req.user._id } },
        }, { new: true });

        // Notify assigned junior doctor
        if (caseDoc?.assignedTo) {
            await Notification.create({
                recipient: caseDoc.assignedTo,
                sender: req.user._id,
                type: 'diagnosis_ready',
                title: 'Diagnosis Provided',
                message: `Senior review complete for case ${caseDoc.caseId}.`,
                relatedCase: caseDoc._id,
            });
        }

        await createLog({ actor: req.user, action: 'CREATE_DIAGNOSIS', module: 'diagnoses', targetId: diagnosis._id, targetModel: 'Diagnosis', ipAddress: req.ip });
        res.status(201).json({ success: true, data: diagnosis });
    } catch (err) { next(err); }
});

// PUT /api/diagnoses/:id
router.put('/:id', protect, authorize('senior_doctor', 'admin'), async (req, res, next) => {
    try {
        const diagnosis = await Diagnosis.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!diagnosis) return res.status(404).json({ success: false, error: 'Diagnosis not found.' });
        await createLog({ actor: req.user, action: 'UPDATE_DIAGNOSIS', module: 'diagnoses', targetId: diagnosis._id, targetModel: 'Diagnosis', ipAddress: req.ip });
        res.json({ success: true, data: diagnosis });
    } catch (err) { next(err); }
});

module.exports = router;
