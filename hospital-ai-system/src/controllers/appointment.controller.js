const Appointment = require('../models/appointment.model');
const User        = require('../models/user.model');
const Doctor      = require('../models/doctor.model');
const { sendSuccess, sendError } = require('../utils/response');
const ROLES = require('../config/roles');

/**
 * POST /api/appointments
 * Book a new appointment (patient only).
 * Accepts doctorId as EITHER the Doctor profile _id OR the doctor's User _id.
 */
const bookAppointment = async (req, res, next) => {
  try {
    const { doctorId, date, time, notes } = req.body;

    // ── Resolve doctorId to a User _id ──────────────────────────────────────
    // The frontend may send the Doctor profile _id (from getAllDoctors) or the User _id.
    let doctorUser = await User.findById(doctorId);

    if (!doctorUser || doctorUser.role !== ROLES.DOCTOR) {
      // Try treating doctorId as a Doctor profile _id
      const doctorProfile = await Doctor.findById(doctorId);
      if (doctorProfile) {
        doctorUser = await User.findById(doctorProfile.user);
      }
    }

    if (!doctorUser || doctorUser.role !== ROLES.DOCTOR) {
      return sendError(res, 404, 'Doctor not found.');
    }

    // ── Date validation ──────────────────────────────────────────────────────
    const [year, month, day] = date.split('-').map(Number);
    const appointmentDate = new Date(year, month - 1, day, 0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (appointmentDate < today) {
      return sendError(res, 400, 'Cannot book an appointment in the past.');
    }

    // ── Check slot is still free ─────────────────────────────────────────────
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
    const endOfDay   = new Date(year, month - 1, day, 23, 59, 59, 999);

    const conflict = await Appointment.findOne({
      doctor: doctorUser._id,
      date:   { $gte: startOfDay, $lte: endOfDay },
      time,
      status: { $ne: 'cancelled' },
    });

    if (conflict) {
      return sendError(res, 409, 'This time slot is already booked. Please choose another slot.');
    }

    // ── Create appointment ───────────────────────────────────────────────────
    const appointment = await Appointment.create({
      patient: req.user._id,
      doctor:  doctorUser._id,
      date:    appointmentDate,
      time,
      notes:   notes || '',
    });

    await appointment.populate([
      { path: 'patient', select: 'name email' },
      { path: 'doctor',  select: 'name email specialization' },
    ]);

    return sendSuccess(res, 201, 'Appointment booked successfully.', { appointment });
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 409, 'This time slot is already booked for the selected doctor.');
    }
    next(error);
  }
};

/**
 * GET /api/appointments
 * - Patient: gets their own appointments.
 * - Doctor / Admin: gets all appointments (with optional filters).
 */
const getMyAppointments = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;

    // Build filter based on role
    const filter = {};
    if (req.user.role === ROLES.PATIENT) {
      filter.patient = req.user._id;
    } else if (req.user.role === ROLES.DOCTOR) {
      filter.doctor = req.user._id;
    }
    // ADMIN sees everything — no filter on patient/doctor

    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [appointments, total] = await Promise.all([
      Appointment.find(filter)
        .populate('patient', 'name email')
        .populate('doctor',  'name email specialization')
        .sort({ date: -1, time: 1 })
        .skip(skip)
        .limit(Number(limit)),
      Appointment.countDocuments(filter),
    ]);

    return sendSuccess(res, 200, 'Appointments fetched.', {
      appointments,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/appointments/:id/cancel
 * Cancel an appointment (patient can only cancel their own).
 */
const cancelAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return sendError(res, 404, 'Appointment not found.');
    }

    // Ownership check — patients can only cancel their own appointments
    if (appointment.patient.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'Not authorized to cancel this appointment.');
    }

    if (appointment.status === 'cancelled') {
      return sendError(res, 400, 'Appointment is already cancelled.');
    }

    if (appointment.status === 'completed') {
      return sendError(res, 400, 'Cannot cancel a completed appointment.');
    }

    appointment.status = 'cancelled';
    await appointment.save();

    await appointment.populate([
      { path: 'patient', select: 'name email' },
      { path: 'doctor', select: 'name email specialization' },
    ]);

    return sendSuccess(res, 200, 'Appointment cancelled.', { appointment });
  } catch (error) {
    next(error);
  }
};

module.exports = { bookAppointment, getMyAppointments, cancelAppointment };
