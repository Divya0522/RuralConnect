const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Patient = require('../models/Patient');
const protect = require('../middleware/auth');
const authorize = require('../middleware/roles');
const { createLog } = require('../utils/logger');

const ALLOWED_ROLES = ['admin', 'helpline_operator', 'helper_doctor', 'junior_doctor', 'senior_doctor'];

// GET /api/patients/me - patient fetches their own record
router.get('/me', protect, async (req, res, next) => {
    try {
        const patient = await Patient.findOne({ user: req.user._id })
            .populate('village', 'name district');
        res.json({ success: true, data: patient || null });
    } catch (err) { next(err); }
});

// GET /api/patients
router.get('/', protect, authorize(...ALLOWED_ROLES), async (req, res, next) => {
    try {
        const { search, village, page = 1, limit = 20 } = req.query;
        const query = {};
        if (village) query.village = village;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
            ];
        }
        const patients = await Patient.find(query)
            .populate('village', 'name district')
            .populate('registeredBy', 'name role')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));
        const total = await Patient.countDocuments(query);
        res.json({ success: true, data: patients, total, page: Number(page), pages: Math.ceil(total / limit) });
    } catch (err) { next(err); }
});

// GET /api/patients/:id
router.get('/:id', protect, async (req, res, next) => {
    try {
        const patient = await Patient.findById(req.params.id)
            .populate('village', 'name district')
            .populate('registeredBy', 'name role');
        if (!patient) return res.status(404).json({ success: false, error: 'Patient not found.' });
        res.json({ success: true, data: patient });
    } catch (err) { next(err); }
});

// POST /api/patients
router.post('/', protect, authorize(...ALLOWED_ROLES, 'patient'), [
    body('name').notEmpty().trim().withMessage('Name required'),
    body('phone').optional().trim(),
    body('age').optional().isInt({ min: 0, max: 150 }),
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        const newPatientData = { ...req.body, registeredBy: req.user._id };
        if (req.user.role === 'patient') {
            newPatientData.user = req.user._id;
        }

        const patient = await Patient.create(newPatientData);
        await createLog({ actor: req.user, action: 'CREATE_PATIENT', module: 'patients', targetId: patient._id, targetModel: 'Patient', description: `Patient ${patient.name} registered`, ipAddress: req.ip });
        res.status(201).json({ success: true, data: patient });
    } catch (err) { next(err); }
});

// PUT /api/patients/:id
router.put('/:id', protect, authorize(...ALLOWED_ROLES), async (req, res, next) => {
    try {
        const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!patient) return res.status(404).json({ success: false, error: 'Patient not found.' });
        await createLog({ actor: req.user, action: 'UPDATE_PATIENT', module: 'patients', targetId: patient._id, targetModel: 'Patient', ipAddress: req.ip });
        res.json({ success: true, data: patient });
    } catch (err) { next(err); }
});

// DELETE /api/patients/:id - Admin only
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
    try {
        const patient = await Patient.findByIdAndDelete(req.params.id);
        if (!patient) return res.status(404).json({ success: false, error: 'Patient not found.' });
        await createLog({ actor: req.user, action: 'DELETE_PATIENT', module: 'patients', targetId: patient._id, targetModel: 'Patient', ipAddress: req.ip });
        res.json({ success: true, message: 'Patient deleted.' });
    } catch (err) { next(err); }
});

module.exports = router;
