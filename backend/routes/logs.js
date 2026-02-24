const express = require('express');
const router = express.Router();
const Log = require('../models/Log');
const protect = require('../middleware/auth');
const authorize = require('../middleware/roles');

// GET /api/logs - Admin only
router.get('/', protect, authorize('admin'), async (req, res, next) => {
    try {
        const { actor, action, module, status, startDate, endDate, page = 1, limit = 50 } = req.query;
        const query = {};
        if (actor) query.actor = actor;
        if (action) query.action = { $regex: action, $options: 'i' };
        if (module) query.module = module;
        if (status) query.status = status;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const logs = await Log.find(query)
            .populate('actor', 'name role email')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));
        const total = await Log.countDocuments(query);
        res.json({ success: true, data: logs, total, page: Number(page), pages: Math.ceil(total / limit) });
    } catch (err) { next(err); }
});

module.exports = router;
