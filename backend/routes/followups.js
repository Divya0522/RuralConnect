const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const FollowUp = require('../models/FollowUp');
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
    body('case').notEmpty(),
    body('patient').notEmpty(),
    body('scheduledDate').isISO8601().withMessage('Valid date required'),
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        const followUp = await FollowUp.create({ ...req.body, scheduledBy: req.user._id });
        const Case = require('../models/Case');
        await Case.findByIdAndUpdate(req.body.case, {
            status: 'followup',
            $push: { statusHistory: { status: 'followup', changedBy: req.user._id } },
        });
        await createLog({ actor: req.user, action: 'CREATE_FOLLOWUP', module: 'followups', targetId: followUp._id, targetModel: 'FollowUp', ipAddress: req.ip });
        res.status(201).json({ success: true, data: followUp });
    } catch (err) { next(err); }
});

// PATCH /api/followups/:id/complete
router.patch('/:id/complete', protect, authorize('junior_doctor', 'admin'), async (req, res, next) => {
    try {
        const followUp = await FollowUp.findByIdAndUpdate(req.params.id, {
            isCompleted: true,
            completedAt: new Date(),
            outcome: req.body.outcome,
        }, { new: true });
        if (!followUp) return res.status(404).json({ success: false, error: 'Follow-up not found.' });
        await createLog({ actor: req.user, action: 'COMPLETE_FOLLOWUP', module: 'followups', targetId: followUp._id, targetModel: 'FollowUp', ipAddress: req.ip });
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
