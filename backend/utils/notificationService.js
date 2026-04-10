const Notification = require('../models/Notification');

/**
 * Centralized service to handle all platform notifications
 */
const notificationService = {
    /**
     * Send a notification to a specific user
     */
    send: async ({ recipient, sender, type, title, message, relatedCase, link }) => {
        try {
            const notif = await Notification.create({
                recipient,
                sender,
                type,
                title,
                message,
                relatedCase,
                link
            });
            return notif;
        } catch (error) {
            console.error('Notification Service Error:', error);
            return null;
        }
    },

    /**
     * Follow-up reminder notification
     */
    sendFollowUpReminder: async (followUp) => {
        return notificationService.send({
            recipient: followUp.patient,
            type: 'alert',
            title: 'Follow-up Reminder',
            message: `You have a follow-up appointment today for your case. Please visit your doctor.`,
            relatedCase: followUp.case,
            link: `/dashboard/cases/${followUp.case}`
        });
    },

    /**
     * Case Resolved notification
     */
    sendCaseResolved: async (caseDoc, resolverId) => {
        return notificationService.send({
            recipient: caseDoc.reportedBy,
            sender: resolverId,
            type: 'case_closed',
            title: 'Case Resolved',
            message: `Your health complaint (ID: ${caseDoc.caseId}) has been marked as resolved.`,
            relatedCase: caseDoc._id
        });
    }
};

module.exports = notificationService;
