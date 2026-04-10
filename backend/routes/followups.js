const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const FollowUp = require('../models/FollowUp');
const Notification = require('../models/Notification');
const protect = require('../middleware/auth');
const authorize = require('../middleware/roles');
const { createLog } = require('../utils/logger');

// GET /api/followups
router.get('/', protect, async (req, res, next) => {
    try {
        const { caseId, isCompleted, page = 1, limit = 20 } = req.query;
        const query = {};
        if (caseId) query.case = caseId;
        if (isCompleted !== undefined) query.isCompleted = isCompleted === 'true';
        if (req.user.role === 'junior_doctor') query.assignedDoctor = req.user._id;
        if (req.user.role === 'patient') {
            const Patient = require('../models/Patient');
            const patient = await Patient.findOne({ user: req.user._id });
            if (patient) query.patient = patient._id;
        }

        const followUps = await FollowUp.find(query)
            .populate('case', 'caseId chiefComplaint status')
            .populate('patient', 'name phone')
            .populate('scheduledBy', 'name role')
            .populate('assignedDoctor', 'name role')
            .sort({ scheduledDate: 1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));
        const total = await FollowUp.countDocuments(query);
        res.json({ success: true, data: followUps, total });
    } catch (err) { next(err); }
});

// POST /api/followups
router.post('/', protect, authorize('junior_doctor', 'senior_doctor', 'admin'), [
    body('case').notEmpty().withMessage('Case ID is required'),
    body('patient').notEmpty().withMessage('Patient ID is required'),
    body('scheduledDate').isISO8601().withMessage('Valid date required'),
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        const followUp = await FollowUp.create({ ...req.body, scheduledBy: req.user._id });

        // Update case status to FOLLOWUP (uppercase)
        const Case = require('../models/Case');
        const caseDoc = await Case.findById(req.body.case);
        if (caseDoc) {
            caseDoc.status = 'FOLLOWUP';
            caseDoc.statusHistory.push({ status: 'FOLLOWUP', changedBy: req.user._id, note: 'Follow-up scheduled' });
            await caseDoc.save();
        }

        // Notify assigned doctor if different from current user
        if (req.body.assignedDoctor && req.body.assignedDoctor !== req.user._id.toString()) {
            await Notification.create({
                recipient: req.body.assignedDoctor,
                sender: req.user._id,
                type: 'followup_scheduled',
                title: '[STAFF] Follow-up Scheduled',
                targetRole: 'junior_doctor',
                message: `A follow-up has been scheduled for case ${caseDoc?.caseId || req.body.case}.`,
                relatedCase: req.body.case,
            });
        }

        await createLog({
            actor: req.user, action: 'CREATE_FOLLOWUP', module: 'followups',
            targetId: followUp._id, targetModel: 'FollowUp', ipAddress: req.ip
        });
        res.status(201).json({ success: true, data: followUp });
    } catch (err) { next(err); }
});

router.patch('/:id/complete', protect, authorize('junior_doctor', 'senior_doctor', 'admin'), async (req, res, next) => {
    try {
        const followUp = await FollowUp.findById(req.params.id);
        if (!followUp) return res.status(404).json({ success: false, error: 'Follow-up not found.' });

        // Security check: Only assigned doctor or admin
        if (req.user.role !== 'admin' && followUp.assignedDoctor?.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, error: 'Only the assigned doctor can complete this follow-up.' });
        }

        followUp.isCompleted = true;
        followUp.completedAt = new Date();
        followUp.outcome = req.body.outcome;
        await followUp.save();

        await createLog({
            actor: req.user, action: 'COMPLETE_FOLLOWUP', module: 'followups',
            targetId: followUp._id, targetModel: 'FollowUp', ipAddress: req.ip
        });
        res.json({ success: true, data: followUp });
    } catch (err) { next(err); }
});

// DELETE /api/followups/:id
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
    try {
        await FollowUp.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Follow-up deleted.' });
    } catch (err) { next(err); }
});

module.exports = router;
