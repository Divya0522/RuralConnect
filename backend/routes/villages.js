const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Village = require('../models/Village');
const protect = require('../middleware/auth');
const authorize = require('../middleware/roles');
const { createLog } = require('../utils/logger');

// GET /api/villages
router.get('/', protect, async (req, res, next) => {
    try {
        const { search, district, page = 1, limit = 50 } = req.query;
        const query = { isActive: true };
        if (district) query.district = district;
        if (search) query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { district: { $regex: search, $options: 'i' } },
        ];
        const villages = await Village.find(query)
            .populate('panchayatOfficer', 'name phone')
            .populate('assignedDoctors', 'name role')
            .sort({ name: 1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));
        const total = await Village.countDocuments(query);
        res.json({ success: true, data: villages, total });
    } catch (err) { next(err); }
});

// GET /api/villages/:id
router.get('/:id', protect, async (req, res, next) => {
    try {
        const village = await Village.findById(req.params.id)
            .populate('panchayatOfficer', 'name phone email')
            .populate('assignedDoctors', 'name role phone');
        if (!village) return res.status(404).json({ success: false, error: 'Village not found.' });
        res.json({ success: true, data: village });
    } catch (err) { next(err); }
});

// POST /api/villages
router.post('/', protect, authorize('admin'), [
    body('name').notEmpty().trim(),
    body('district').notEmpty().trim(),
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
        const village = await Village.create(req.body);
        await createLog({ actor: req.user, action: 'CREATE_VILLAGE', module: 'villages', targetId: village._id, targetModel: 'Village', ipAddress: req.ip });
        res.status(201).json({ success: true, data: village });
    } catch (err) { next(err); }
});

// PUT /api/villages/:id
router.put('/:id', protect, authorize('admin'), async (req, res, next) => {
    try {
        const village = await Village.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!village) return res.status(404).json({ success: false, error: 'Village not found.' });
        await createLog({ actor: req.user, action: 'UPDATE_VILLAGE', module: 'villages', targetId: village._id, targetModel: 'Village', ipAddress: req.ip });
        res.json({ success: true, data: village });
    } catch (err) { next(err); }
});

module.exports = router;
