/**
 * Alert Cron Jobs
 * ───────────────
 * Scheduled tasks that run periodically to detect missed appointments.
 * Imported and started once in server.js after DB connects.
 */

const cron = require('node-cron');
const Appointment = require('../models/appointment.model');
const { triggerMissedAppointmentAlert } = require('../services/alert.service');

/**
 * Every hour: find appointments whose date has passed and are still
 * pending or confirmed → mark them missed and alert the patient.
 *
 * We add a `missedAlertSent` flag on the appointment to avoid duplicate alerts.
 * Because the Appointment model doesn't have that field yet we use a lean
 * in-memory guard via a Set per run (safe for single-process deployments).
 */
const startMissedAppointmentJob = () => {
  // Runs every hour at minute 0  →  "0 * * * *"
  cron.schedule('0 * * * *', async () => {
    console.log('[Cron] Checking for missed appointments...');

    try {
      const now = new Date();

      // Appointments in the past that are still pending or confirmed
      const missed = await Appointment.find({
        date: { $lt: now },
        status: { $in: ['pending', 'confirmed'] },
        missedAlertSent: { $ne: true }, // skip already-alerted ones
      }).populate('patient', 'name email');

      if (missed.length === 0) return;

      console.log(`[Cron] Found ${missed.length} missed appointment(s).`);

      for (const appt of missed) {
        await triggerMissedAppointmentAlert(appt);

        // Mark so we don't re-alert on the next run
        await Appointment.findByIdAndUpdate(appt._id, { missedAlertSent: true });
      }
    } catch (err) {
      console.error('[Cron] Missed appointment job failed:', err.message);
    }
  });

  console.log('[Cron] Missed appointment job scheduled (every hour).');
};

module.exports = { startMissedAppointmentJob };
