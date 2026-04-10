const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const protect = require('../middleware/auth');
const { createLog } = require('../utils/logger');

const generateTokens = (userId) => {
    const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '15m' });
    const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' });
    return { accessToken, refreshToken };
};

// POST /api/auth/register
router.post('/register', [
    body('name').notEmpty().trim().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['patient', 'helpline_operator', 'helper_doctor', 'junior_doctor', 'senior_doctor', 'panchayat_officer', 'admin']).withMessage('Invalid role'),
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        const { name, email, password, role, phone, village, qualification } = req.body;
        const existing = await User.findOne({ email });
        if (existing) return res.status(409).json({ success: false, error: 'Email already registered.' });

        const user = await User.create({ name, email, password, role, phone, village, qualification });
        const { accessToken, refreshToken } = generateTokens(user._id);
        user.refreshToken = refreshToken;
        await user.save();

        await createLog({ actor: user, action: 'REGISTER', module: 'auth', description: `New ${role} registered`, ipAddress: req.ip });

        res.status(201).json({ success: true, data: { user, accessToken, refreshToken } });
    } catch (err) { next(err); }
});

// POST /api/auth/login
router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        const { email, password } = req.body;
        const user = await User.findOne({ email }).select('+password +refreshToken');
        if (!user || !(await user.comparePassword(password))) {
            await createLog({ action: 'LOGIN_FAILED', module: 'auth', description: `Failed login for ${email}`, ipAddress: req.ip, status: 'failure' });
            return res.status(401).json({ success: false, error: 'Invalid credentials.' });
        }

        if (!user.isActive) return res.status(403).json({ success: false, error: 'Account deactivated.' });

        const { accessToken, refreshToken } = generateTokens(user._id);
        user.refreshToken = refreshToken;
        user.lastLogin = new Date();
        await user.save();

        await createLog({ actor: user, action: 'LOGIN', module: 'auth', description: 'User logged in', ipAddress: req.ip });

        const userObj = user.toJSON();
        res.json({ success: true, data: { user: userObj, accessToken, refreshToken } });
    } catch (err) { next(err); }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(401).json({ success: false, error: 'No refresh token.' });

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.id).select('+refreshToken');
        if (!user || user.refreshToken !== refreshToken) {
            return res.status(401).json({ success: false, error: 'Invalid refresh token.' });
        }

        const tokens = generateTokens(user._id);
        user.refreshToken = tokens.refreshToken;
        await user.save();

        res.json({ success: true, data: tokens });
    } catch (err) {
        if (err.name === 'TokenExpiredError') return res.status(401).json({ success: false, error: 'Refresh token expired.' });
        next(err);
    }
});

// POST /api/auth/logout
router.post('/logout', protect, async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        user.refreshToken = null;
        await user.save();
        await createLog({ actor: req.user, action: 'LOGOUT', module: 'auth', ipAddress: req.ip });
        res.json({ success: true, message: 'Logged out successfully.' });
    } catch (err) { next(err); }
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
    res.json({ success: true, data: req.user });
});

module.exports = router;
