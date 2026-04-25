/**
 * Alert Service
 * ─────────────
 * Pure business-logic functions that create Alert documents and emit
 * real-time Socket.io events to the affected users.
 *
 * Imported by:
 *   • patient.controller  → checkCriticalCondition, checkOutbreak
 *   • appointment.controller → triggerMissedAppointmentAlert
 *   • alert.cron          → triggerMissedAppointmentAlert (batch)
 */

const Alert = require('../models/alert.model');
const User = require('../models/user.model');
const ROLES = require('../config/roles');

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Persist an alert and push it in real-time to the recipient's socket room.
 * Never throws — failures are logged so callers are not disrupted.
 */
const _createAndEmit = async ({ userId, message, type }) => {
  try {
    const alert = await Alert.create({ userId, message, type });

    // Emit to the user's personal room (userId string)
    try {
      const { getIO } = require('../utils/socket');
      getIO().to(userId.toString()).emit('alert', {
        _id: alert._id,
        message: alert.message,
        type: alert.type,
        status: alert.status,
        createdAt: alert.createdAt,
      });
    } catch (_) {
      // Socket not yet initialised (e.g. during tests) — skip silently
    }

    return alert;
  } catch (err) {
    console.error('[AlertService] Failed to create alert:', err.message);
    return null;
  }
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Called after a patient profile is saved.
 * If chronicDiseases contains "critical" (case-insensitive) OR the patient
 * has a field `condition: 'critical'`, alert every doctor and admin.
 *
 * @param {Object} patientProfile  – Mongoose Patient document (populated user)
 */
const checkCriticalCondition = async (patientProfile) => {
  const diseases = patientProfile.chronicDiseases || [];
  const isCritical =
    patientProfile.condition === 'critical' ||
    diseases.some((d) => d.toLowerCase().includes('critical'));

  if (!isCritical) return;

  // Find all doctors and admins to notify
  const recipients = await User.find({
    role: { $in: [ROLES.DOCTOR, ROLES.ADMIN] },
    isActive: true,
  }).select('_id name');

  const patientName =
    patientProfile.user?.name || patientProfile.user?.toString() || 'A patient';

  await Promise.all(
    recipients.map((r) =>
      _createAndEmit({
        userId: r._id,
        message: `CRITICAL: ${patientName}'s condition has been marked as critical. Immediate attention required.`,
        type: 'critical',
      })
    )
  );
};

/**
 * Called when an appointment is detected as missed (past date, still pending/confirmed).
 *
 * @param {Object} appointment – Mongoose Appointment document (patient & doctor populated)
 */
const triggerMissedAppointmentAlert = async (appointment) => {
  const patientId = appointment.patient?._id || appointment.patient;
  const appointmentDate = new Date(appointment.date).toLocaleDateString();

  await _createAndEmit({
    userId: patientId,
    message: `Reminder: You missed your appointment scheduled for ${appointmentDate}. Please reschedule.`,
    type: 'reminder',
  });
};

/**
 * Called after a patient profile is saved.
 * If 3 or more patients share the same chronic disease/symptom, fire an
 * outbreak alert to all doctors and admins.
 *
 * @param {string[]} symptoms – chronicDiseases array from the saved profile
 */
const checkOutbreak = async (symptoms) => {
  if (!symptoms || symptoms.length === 0) return;

  // Threshold: 3+ patients with the same symptom = outbreak
  const OUTBREAK_THRESHOLD = 3;

  const Patient = require('../models/patient.model');

  for (const symptom of symptoms) {
    const count = await Patient.countDocuments({
      chronicDiseases: { $regex: new RegExp(`^${symptom}$`, 'i') },
    });

    if (count >= OUTBREAK_THRESHOLD) {
      const recipients = await User.find({
        role: { $in: [ROLES.DOCTOR, ROLES.ADMIN] },
        isActive: true,
      }).select('_id');

      await Promise.all(
        recipients.map((r) =>
          _createAndEmit({
            userId: r._id,
            message: `OUTBREAK ALERT: ${count} patients have reported "${symptom}". Immediate review recommended.`,
            type: 'outbreak',
          })
        )
      );

      // Only alert once per symptom per save — avoid duplicate outbreak alerts
      break;
    }
  }
};

module.exports = { checkCriticalCondition, triggerMissedAppointmentAlert, checkOutbreak };
