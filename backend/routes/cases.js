const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Case = require('../models/Case');
const Notification = require('../models/Notification');
const protect = require('../middleware/auth');
const authorize = require('../middleware/roles');
const upload = require('../middleware/upload');
const { createLog } = require('../utils/logger');

// GET /api/cases
router.get('/', protect, async (req, res, next) => {
    try {
        const { status, village, assignedTo, severity, search, page = 1, limit = 20 } = req.query;
        const query = {};

        // Role-based filtering
        if (req.user.role === 'patient') {
            const Patient = require('../models/Patient');
            const patient = await Patient.findOne({ user: req.user._id });
            if (patient) query.patient = patient._id;
            else return res.json({ success: true, data: [], total: 0 });
        } else if (req.user.role === 'junior_doctor') {
            query.$or = [
                { assignedTo: req.user._id },
                { status: 'submitted' }
            ];
        } else if (req.user.role === 'panchayat_officer') {
            query.village = req.user.village;
        }

        if (status) query.status = status;
        if (village && !['panchayat_officer'].includes(req.user.role)) query.village = village;
        if (assignedTo) query.assignedTo = assignedTo;
        if (severity) query.severity = severity;
        if (search) query.$or = [{ chiefComplaint: { $regex: search, $options: 'i' } }, { caseId: { $regex: search, $options: 'i' } }];

        const [cases, total] = await Promise.all([
            Case.find(query)
                .populate('patient', 'name age gender phone')
                .populate('assignedTo', 'name role phone')
                .populate('village', 'name district')
                .populate('reportedBy', 'name role')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(Number(limit)),
            Case.countDocuments(query),
        ]);

        res.json({ success: true, data: cases, total, page: Number(page), pages: Math.ceil(total / limit) });
    } catch (err) { next(err); }
});

// GET /api/cases/:id
router.get('/:id', protect, async (req, res, next) => {
    try {
        const caseDoc = await Case.findById(req.params.id)
            .populate('patient')
            .populate('assignedTo', 'name role phone qualification')
            .populate('village', 'name district')
            .populate('reportedBy', 'name role')
            .populate('seniorReviewedBy', 'name role')
            .populate('statusHistory.changedBy', 'name role');
        if (!caseDoc) return res.status(404).json({ success: false, error: 'Case not found.' });
        res.json({ success: true, data: caseDoc });
    } catch (err) { next(err); }
});

// POST /api/cases - create new case
router.post('/', protect, (req, res, next) => { req.uploadFolder = 'cases'; next(); }, upload.array('symptomImages', 5), [
    body('patient').notEmpty().withMessage('Patient ID required'),
    body('chiefComplaint').notEmpty().trim().withMessage('Chief complaint required'),
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        const symptomImages = req.files ? req.files.map(f => f.path) : [];
        const symptoms = req.body.symptoms ? (Array.isArray(req.body.symptoms) ? req.body.symptoms : [req.body.symptoms]) : [];

        const caseDoc = await Case.create({
            ...req.body,
            symptoms,
            symptomImages,
            reportedBy: req.user._id,
            statusHistory: [{ status: 'submitted', changedBy: req.user._id }],
        });

        await createLog({ actor: req.user, action: 'CREATE_CASE', module: 'cases', targetId: caseDoc._id, targetModel: 'Case', description: `Case ${caseDoc.caseId} submitted`, ipAddress: req.ip });
        res.status(201).json({ success: true, data: caseDoc });
    } catch (err) { next(err); }
});

// PATCH /api/cases/:id/assign - Helpline operator assigns junior doctor
router.patch('/:id/assign', protect, authorize('helpline_operator', 'admin'), [
    body('assignedTo').notEmpty().withMessage('Doctor ID required'),
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        const caseDoc = await Case.findById(req.params.id);
        if (!caseDoc) return res.status(404).json({ success: false, error: 'Case not found.' });

        caseDoc.assignedTo = req.body.assignedTo;
        caseDoc.assignedBy = req.user._id;
        caseDoc.assignedAt = new Date();
        caseDoc.status = 'assigned';
        caseDoc.statusHistory.push({ status: 'assigned', changedBy: req.user._id, note: req.body.note });
        await caseDoc.save();

        // Notify the assigned doctor
        await Notification.create({
            recipient: req.body.assignedTo,
            sender: req.user._id,
            type: 'case_assigned',
            title: 'New Case Assigned',
            message: `Case ${caseDoc.caseId} has been assigned to you.`,
            relatedCase: caseDoc._id,
        });

        await createLog({ actor: req.user, action: 'ASSIGN_CASE', module: 'cases', targetId: caseDoc._id, targetModel: 'Case', description: `Case ${caseDoc.caseId} assigned`, ipAddress: req.ip });
        res.json({ success: true, data: caseDoc });
    } catch (err) { next(err); }
});

// PATCH /api/cases/:id/status - Update case status
router.patch('/:id/status', protect, authorize('admin', 'junior_doctor', 'senior_doctor'), [
    body('status').isIn(['submitted', 'assigned', 'visited', 'reviewed', 'treated', 'followup', 'closed']),
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        const caseDoc = await Case.findById(req.params.id);
        if (!caseDoc) return res.status(404).json({ success: false, error: 'Case not found.' });

        caseDoc.status = req.body.status;
        caseDoc.statusHistory.push({ status: req.body.status, changedBy: req.user._id, note: req.body.note });
        await caseDoc.save();

        // Notify patient / relevant roles
        await Notification.create({
            recipient: caseDoc.reportedBy,
            sender: req.user._id,
            type: 'case_updated',
            title: 'Case Status Updated',
            message: `Your case ${caseDoc.caseId} status is now: ${req.body.status}`,
            relatedCase: caseDoc._id,
        });

        await createLog({ actor: req.user, action: 'UPDATE_CASE_STATUS', module: 'cases', targetId: caseDoc._id, targetModel: 'Case', description: `Status → ${req.body.status}`, ipAddress: req.ip });
        res.json({ success: true, data: caseDoc });
    } catch (err) { next(err); }
});

// PATCH /api/cases/:id/request-senior-review
router.patch('/:id/request-senior-review', protect, authorize('junior_doctor'), async (req, res, next) => {
    try {
        const caseDoc = await Case.findByIdAndUpdate(req.params.id, {
            seniorReviewRequested: true,
            status: 'followup',
            assignedTo: req.body.seniorId || undefined // Optionally target a specific senior
        }, { new: true });
        if (!caseDoc) return res.status(404).json({ success: false, error: 'Case not found.' });

        const User = require('../models/User');
        let seniors = [];
        if (req.body.seniorId) {
            seniors = [{ _id: req.body.seniorId }];
        } else {
            seniors = await User.find({ role: 'senior_doctor', isActive: true }, '_id');
        }

        await Notification.insertMany(seniors.map(s => ({
            recipient: s._id,
            sender: req.user._id,
            type: 'review_requested',
            title: 'Senior Review Requested',
            message: `Case ${caseDoc.caseId} requires senior review.`,
            relatedCase: caseDoc._id,
        })));

        // Update status history
        caseDoc.statusHistory.push({ status: 'followup', changedBy: req.user._id, note: 'Escalated to Senior Doctor' });
        await caseDoc.save();

        await createLog({ actor: req.user, action: 'REQUEST_SENIOR_REVIEW', module: 'cases', targetId: caseDoc._id, targetModel: 'Case', ipAddress: req.ip });
        res.json({ success: true, data: caseDoc });
    } catch (err) { next(err); }
});

module.exports = router;
