const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }
        // Fallback: allow token as query param for file download endpoints (e.g. PDF)
        if (!token && req.query.token) {
            token = req.query.token;
        }

        if (!token) {
            return res.status(401).json({ success: false, error: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password -refreshToken');

        if (!user) {
            return res.status(401).json({ success: false, error: 'User not found.' });
        }

        if (!user.isActive) {
            return res.status(401).json({ success: false, error: 'Account is deactivated.' });
        }

        req.user = user;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, error: 'Token expired.', code: 'TOKEN_EXPIRED' });
        }
        return res.status(401).json({ success: false, error: 'Invalid token.' });
    }
};

module.exports = protect;
