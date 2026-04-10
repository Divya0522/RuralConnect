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
                { status: 'NEW' }
            ];
        } else if (req.user.role === 'helpline_operator') {
            query.reportedBy = req.user._id;
        } else if (req.user.role === 'helper_doctor') {
            query.createdByHelperId = req.user._id;
        } else if (req.user.role === 'senior_doctor') {
            // Senior doctors see escalated/specialist cases, those they reviewed, and those directly assigned to them
            query.$or = [
                { status: { $in: ['ESCALATED', 'SPECIALIST_REVIEW'] } },
                { seniorReviewedBy: req.user._id },
                { assignedTo: req.user._id },
            ];
        }
        // admin sees all — no filter

        if (status) query.status = status;
        if (village) query.village = village;
        if (assignedTo) query.assignedTo = assignedTo;
        if (severity) query.severity = severity;
        if (search) {
            const searchRegex = { $regex: search, $options: 'i' };
            const searchOr = [{ chiefComplaint: searchRegex }, { caseId: searchRegex }];
            // Merge with existing $or if present
            if (query.$or) {
                query.$and = [{ $or: query.$or }, { $or: searchOr }];
                delete query.$or;
            } else {
                query.$or = searchOr;
            }
        }

        const [cases, total] = await Promise.all([
            Case.find(query)
                .populate('patient', 'name age gender phone village')
                .populate('assignedTo', 'name role phone qualification')
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
            .populate('seniorReviewedBy', 'name role qualification')
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

        const isHelperDoctor = req.user.role === 'helper_doctor';
        const initialStatus = isHelperDoctor ? 'DRAFT' : 'NEW';

        const caseData = {
            ...req.body,
            symptoms,
            symptomImages,
            reportedBy: req.user._id,
            status: initialStatus,
            statusHistory: [{ status: initialStatus, changedBy: req.user._id }],
        };

        if (isHelperDoctor) {
            caseData.createdByHelperId = req.user._id;
        }

        const caseDoc = await Case.create(caseData);

        await createLog({ actor: req.user, action: 'CREATE_CASE', module: 'cases', targetId: caseDoc._id, targetModel: 'Case', description: `Case ${caseDoc.caseId} submitted`, ipAddress: req.ip });

        // Notify doctors about new case with Patient Name
        const User = require('../models/User');
        const Patient = require('../models/Patient');
        const patientData = await Patient.findById(req.body.patient, 'name');
        const patientName = patientData?.name || 'Unknown Patient';

        // Notify doctors only if it's NOT a draft case (helper doctors don't notify immediately)
        if (!isHelperDoctor) {
            const isEmergency = req.body.severity === 'critical';
            const rolesToNotify = isEmergency ? ['junior_doctor', 'senior_doctor'] : ['junior_doctor'];

            const doctors = await User.find({ role: { $in: rolesToNotify }, isActive: true }, '_id');

            if (doctors.length > 0) {
                await Notification.insertMany(doctors.map(d => ({
                    recipient: d._id,
                    sender: req.user._id,
                    type: isEmergency ? 'alert' : 'case_assigned',
                    title: isEmergency ? '[MEDICAL ALERT] EMERGENCY' : '[STAFF] New Case Available',
                    targetRole: d.role,
                    message: isEmergency
                        ? `EMERGENCY ALERT: ${patientName} triggered an emergency alert for ${caseDoc.chiefComplaint}`
                        : `New case ${caseDoc.caseId} submitted for ${patientName}: ${caseDoc.chiefComplaint}`,
                    relatedCase: caseDoc._id,
                })));
            }
        }

        res.status(201).json({ success: true, data: caseDoc });
    } catch (err) { next(err); }
});

// PATCH /api/cases/:id/assign - Assign junior doctor to case
router.patch('/:id/assign', protect, authorize('helpline_operator', 'admin', 'junior_doctor', 'helper_doctor'), [
    body('assignedTo').notEmpty().withMessage('Doctor ID required'),
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        const caseDoc = await Case.findById(req.params.id);
        if (!caseDoc) return res.status(404).json({ success: false, error: 'Case not found.' });

        const User = require('../models/User');
        const assignedDoctor = await User.findById(req.body.assignedTo);
        if (!assignedDoctor) return res.status(404).json({ success: false, error: 'Doctor not found.' });

        caseDoc.assignedTo = req.body.assignedTo;
        caseDoc.assignedDoctorRole = assignedDoctor.role;
        caseDoc.assignedBy = req.user._id;
        caseDoc.assignedAt = new Date();
        caseDoc.status = 'ASSIGNED';
        caseDoc.statusHistory.push({ status: 'ASSIGNED', changedBy: req.user._id, note: req.body.note });
        await caseDoc.save();

        // Notify the assigned doctor
        await Notification.create({
            recipient: req.body.assignedTo,
            sender: req.user._id,
            type: 'case_assigned',
            title: '[STAFF] New Case Assigned',
            targetRole: assignedDoctor.role,
            message: `Case ${caseDoc.caseId} has been assigned to you.`,
            relatedCase: caseDoc._id,
        });

        await createLog({ actor: req.user, action: 'ASSIGN_CASE', module: 'cases', targetId: caseDoc._id, targetModel: 'Case', description: `Case ${caseDoc.caseId} assigned`, ipAddress: req.ip });
        res.json({ success: true, data: caseDoc });
    } catch (err) { next(err); }
});

// PATCH /api/cases/:id/status - Update case status
router.patch('/:id/status', protect, authorize('admin', 'junior_doctor', 'senior_doctor'), [
    body('status').notEmpty().withMessage('Status is required'),
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        const caseDoc = await Case.findById(req.params.id);
        if (!caseDoc) return res.status(404).json({ success: false, error: 'Case not found.' });

        const validTransitions = {
            'DRAFT': ['ASSIGNED', 'CLOSED'],
            'NEW': ['ASSIGNED', 'CLOSED'],
            'ASSIGNED': ['DIAGNOSED', 'FOLLOWUP', 'ESCALATED', 'RESOLVED', 'CLOSED'],
            'DIAGNOSED': ['FOLLOWUP', 'RESOLVED', 'ESCALATED', 'CLOSED'],
            'FOLLOWUP': ['DIAGNOSED', 'ESCALATED', 'RESOLVED', 'CLOSED'],
            'ESCALATED': ['SPECIALIST_REVIEW', 'RESOLVED', 'CLOSED'],
            'SPECIALIST_REVIEW': ['RESOLVED', 'FOLLOWUP', 'CLOSED'],
            'RESOLVED': ['CLOSED', 'FOLLOWUP'],
            'CLOSED': []
        };

        if (caseDoc.status !== req.body.status && !validTransitions[caseDoc.status]?.includes(req.body.status)) {
            return res.status(400).json({ success: false, error: `Invalid status transition from ${caseDoc.status} to ${req.body.status}` });
        }

        // Restriction: Case cannot move to RESOLVED or CLOSED if follow-up pending
        if (['RESOLVED', 'CLOSED'].includes(req.body.status)) {
            const FollowUp = require('../models/FollowUp');
            const pendingFollowUp = await FollowUp.findOne({ case: caseDoc._id, isCompleted: false });
            if (pendingFollowUp) {
                return res.status(400).json({ success: false, error: 'Cannot resolve case with pending follow-up. Please complete all follow-ups first.' });
            }
        }

        // Role checks: only senior_doctor or admin can resolve escalated/specialist_review cases
        if (req.body.status === 'RESOLVED' && req.user.role === 'junior_doctor' &&
            ['SPECIALIST_REVIEW', 'ESCALATED'].includes(caseDoc.status)) {
            return res.status(403).json({ success: false, error: 'Only senior doctor can resolve this case.' });
        }

        caseDoc.status = req.body.status;
        if (req.body.status === 'RESOLVED') caseDoc.resolvedAt = Date.now();
        if (req.body.status === 'CLOSED') caseDoc.closedAt = Date.now();
        if (req.body.status === 'SPECIALIST_REVIEW' && req.user.role === 'senior_doctor') {
            caseDoc.seniorReviewedBy = req.user._id;
        }
        caseDoc.statusHistory.push({ status: req.body.status, changedBy: req.user._id, note: req.body.note });
        await caseDoc.save();

        // Notify relevant people on key transitions
        const notifPayload = {
            sender: req.user._id,
            relatedCase: caseDoc._id,
        };

        if (req.body.status === 'CLOSED' || req.body.status === 'RESOLVED') {
            // Notify the reporter (patient or helpline operator)
            await Notification.create({
                ...notifPayload,
                recipient: caseDoc.reportedBy,
                type: req.body.status === 'CLOSED' ? 'case_closed' : 'system',
                title: req.body.status === 'CLOSED' ? '[PATIENT] Case Closed' : '[PATIENT] Case Resolved',
                targetRole: 'patient',
                message: req.body.status === 'CLOSED'
                    ? `Your case ${caseDoc.caseId} has been closed.`
                    : `Your case ${caseDoc.caseId} has been resolved.`,
            });
        }

        await createLog({ actor: req.user, action: 'UPDATE_CASE_STATUS', module: 'cases', targetId: caseDoc._id, targetModel: 'Case', description: `Status → ${req.body.status}`, ipAddress: req.ip });
        res.json({ success: true, data: caseDoc });
    } catch (err) { next(err); }
});

// PATCH /api/cases/:id/request-senior-review
router.patch('/:id/request-senior-review', protect, authorize('junior_doctor'), async (req, res, next) => {
    try {
        const caseDoc = await Case.findById(req.params.id);
        if (!caseDoc) return res.status(404).json({ success: false, error: 'Case not found.' });

        caseDoc.seniorReviewRequested = true;
        caseDoc.status = 'ESCALATED';
        caseDoc.statusHistory.push({ status: 'ESCALATED', changedBy: req.user._id, note: req.body.note || 'Escalated for senior review' });
        if (req.body.seniorId) {
            caseDoc.seniorReviewedBy = req.body.seniorId;
        }
        await caseDoc.save();

        const User = require('../models/User');
        let seniors = [];
        if (req.body.seniorId) {
            seniors = [{ _id: req.body.seniorId }];
        } else {
            seniors = await User.find({ role: 'senior_doctor', isActive: true }, '_id');
        }

        if (seniors.length > 0) {
            await Notification.insertMany(seniors.map(s => ({
                recipient: s._id,
                sender: req.user._id,
                type: 'case_escalated',
                title: 'Senior Review Requested',
                message: `Case ${caseDoc.caseId} requires your specialist review.`,
                relatedCase: caseDoc._id,
            })));
        }

        await createLog({ actor: req.user, action: 'REQUEST_SENIOR_REVIEW', module: 'cases', targetId: caseDoc._id, targetModel: 'Case', ipAddress: req.ip });
        res.json({ success: true, data: caseDoc });
    } catch (err) { next(err); }
});

// PATCH /api/cases/:id/resolve - Senior doctor resolves and closes
router.patch('/:id/resolve', protect, authorize('senior_doctor', 'admin'), async (req, res, next) => {
    try {
        const caseDoc = await Case.findById(req.params.id);
        if (!caseDoc) return res.status(404).json({ success: false, error: 'Case not found.' });

        const newStatus = req.body.close ? 'CLOSED' : 'RESOLVED';
        caseDoc.status = newStatus;
        caseDoc.seniorReviewedBy = req.user._id;
        if (newStatus === 'RESOLVED') caseDoc.resolvedAt = Date.now();
        if (newStatus === 'CLOSED') caseDoc.closedAt = Date.now();
        caseDoc.closureNote = req.body.closureNote || req.body.note;
        caseDoc.statusHistory.push({ status: newStatus, changedBy: req.user._id, note: req.body.note || 'Resolved by senior doctor' });
        await caseDoc.save();

        await Notification.create({
            recipient: caseDoc.reportedBy,
            sender: req.user._id,
            type: 'case_closed',
            title: newStatus === 'CLOSED' ? 'Case Closed' : 'Case Resolved',
            message: `Your case ${caseDoc.caseId} has been ${newStatus.toLowerCase()} by a senior specialist.`,
            relatedCase: caseDoc._id,
        });

        await createLog({ actor: req.user, action: `${newStatus}_CASE`, module: 'cases', targetId: caseDoc._id, targetModel: 'Case', ipAddress: req.ip });
        res.json({ success: true, data: caseDoc });
    } catch (err) { next(err); }
});

module.exports = router;
