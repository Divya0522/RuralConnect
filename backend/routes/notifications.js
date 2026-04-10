const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const protect = require('../middleware/auth');
const authorize = require('../middleware/roles');

// GET /api/notifications - user's own notifications
router.get('/', protect, async (req, res, next) => {
    try {
        const { isRead, page = 1, limit = 30 } = req.query;
        const query = { recipient: req.user._id };
        if (isRead !== undefined) query.isRead = isRead === 'true';

        const notifications = await Notification.find(query)
            .populate('sender', 'name role')
            .populate({
                path: 'relatedCase',
                select: 'caseId chiefComplaint status severity patient',
                populate: { path: 'patient', select: 'name village phone age gender' }
            })
            .sort({ isRead: 1, createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));
        const total = await Notification.countDocuments(query);
        const unread = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
        res.json({ success: true, data: notifications, total, unread });
    } catch (err) { next(err); }
});

// PATCH /api/notifications/:id/read - mark as read
router.patch('/:id/read', protect, async (req, res, next) => {
    try {
        await Notification.findOneAndUpdate(
            { _id: req.params.id, recipient: req.user._id },
            { isRead: true, readAt: new Date() }
        );
        res.json({ success: true });
    } catch (err) { next(err); }
});

// PATCH /api/notifications/read-all
router.patch('/read-all', protect, async (req, res, next) => {
    try {
        await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true, readAt: new Date() });
        res.json({ success: true, message: 'All notifications marked as read.' });
    } catch (err) { next(err); }
});

// DELETE /api/notifications/:id
router.delete('/:id', protect, async (req, res, next) => {
    try {
        await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
        res.json({ success: true });
    } catch (err) { next(err); }
});

// POST /api/notifications - admin broadcast
router.post('/', protect, authorize('admin'), async (req, res, next) => {
    try {
        const { recipients, title, message, type } = req.body;
        if (!recipients || !recipients.length) return res.status(400).json({ success: false, error: 'Recipients required.' });
        const notifs = await Notification.insertMany(
            recipients.map(r => ({ recipient: r, sender: req.user._id, title, message, type: type || 'system' }))
        );
        res.status(201).json({ success: true, data: notifs });
    } catch (err) { next(err); }
});

module.exports = router;
