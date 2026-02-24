/**
 * Role-based access control middleware.
 * Usage: authorize('admin', 'senior_doctor')
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, error: 'Not authenticated.' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: `Access denied. Role '${req.user.role}' is not authorized for this resource.`,
            });
        }

        next();
    };
};

module.exports = authorize;
