const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const protect = require('../middleware/auth');
const authorize = require('../middleware/roles');
const { createLog } = require('../utils/logger');

// GET /api/users - List users (Admin: all, Others: filtered)
router.get('/', protect, authorize('admin', 'junior_doctor', 'senior_doctor'), async (req, res, next) => {
    try {
        const { role, isActive, search, page = 1, limit = 20 } = req.query;
        const query = {};
        if (role) query.role = role;
        if (isActive !== undefined) query.isActive = isActive === 'true';
        if (search) query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
        ];
        const users = await User.find(query)
            .populate('village', 'name district')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));
        const total = await User.countDocuments(query);
        res.json({ success: true, data: users, total, page: Number(page), pages: Math.ceil(total / limit) });
    } catch (err) { next(err); }
});

// GET /api/users/:id
router.get('/:id', protect, authorize('admin'), async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).populate('village', 'name district');
        if (!user) return res.status(404).json({ success: false, error: 'User not found.' });
        res.json({ success: true, data: user });
    } catch (err) { next(err); }
});

// PUT /api/users/:id - Admin update user
router.put('/:id', protect, authorize('admin'), [
    body('name').optional().notEmpty().trim(),
    body('role').optional().isIn(['patient', 'helpline_operator', 'junior_doctor', 'senior_doctor', 'panchayat_officer', 'admin']),
    body('isActive').optional().isBoolean(),
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        const { password, ...updateData } = req.body; // never update password via this route
        const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
        if (!user) return res.status(404).json({ success: false, error: 'User not found.' });

        await createLog({ actor: req.user, action: 'UPDATE_USER', module: 'users', targetId: user._id, targetModel: 'User', description: `Updated user ${user.name}`, ipAddress: req.ip });
        res.json({ success: true, data: user });
    } catch (err) { next(err); }
});

// DELETE /api/users/:id - Admin deactivate user
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
        if (!user) return res.status(404).json({ success: false, error: 'User not found.' });
        await createLog({ actor: req.user, action: 'DEACTIVATE_USER', module: 'users', targetId: user._id, targetModel: 'User', description: `Deactivated user ${user.name}`, ipAddress: req.ip });
        res.json({ success: true, message: 'User deactivated.' });
    } catch (err) { next(err); }
});

// PATCH /api/users/:id/reset-password - Admin reset password
router.patch('/:id/reset-password', protect, authorize('admin'), [
    body('newPassword').isLength({ min: 6 }).withMessage('Min 6 characters'),
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, error: 'User not found.' });
        user.password = req.body.newPassword;
        await user.save();
        await createLog({ actor: req.user, action: 'RESET_PASSWORD', module: 'users', targetId: user._id, targetModel: 'User', ipAddress: req.ip });
        res.json({ success: true, message: 'Password reset.' });
    } catch (err) { next(err); }
});

module.exports = router;
