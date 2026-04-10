const cron = require('node-cron');
const FollowUp = require('../models/FollowUp');
const notificationService = require('./notificationService');

/**
 * Scheduler to run background jobs
 */
const initScheduler = () => {
    // Run daily at midnight (00:00)
    cron.schedule('0 0 * * *', async () => {
        console.log('[Scheduler] Running daily follow-up check...');
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);

            // Find follow-ups scheduled for today that haven't had a reminder sent
            const pendingFollowUps = await FollowUp.find({
                scheduledDate: {
                    $gte: today,
                    $lt: tomorrow
                },
                isCompleted: false,
                reminderSent: false
            });

            console.log(`[Scheduler] Found ${pendingFollowUps.length} follow-ups for today.`);

            for (const followUp of pendingFollowUps) {
                await notificationService.sendFollowUpReminder(followUp);

                followUp.reminderSent = true;
                followUp.reminderSentAt = new Date();
                await followUp.save();
            }

            console.log('[Scheduler] Daily follow-up check complete.');
        } catch (error) {
            console.error('[Scheduler] Error in follow-up check:', error);
        }
    });

    console.log('[Scheduler] Background jobs initialized.');
};

module.exports = { initScheduler };
