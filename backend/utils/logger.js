const Log = require('../models/Log');

/**
 * Create an audit log entry.
 */
const createLog = async ({ actor, action, module, targetId, targetModel, description, ipAddress, userAgent, status = 'success', meta } = {}) => {
    try {
        await Log.create({
            actor: actor?._id || actor,
            actorName: actor?.name,
            actorRole: actor?.role,
            action,
            module,
            targetId,
            targetModel,
            description,
            ipAddress,
            userAgent,
            status,
            meta,
        });
    } catch (err) {
        // Logging should never crash the main flow
        console.error('Log creation failed:', err.message);
    }
};

module.exports = { createLog };
