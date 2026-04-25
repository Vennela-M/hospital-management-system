const Doctor      = require('../models/doctor.model');
const User        = require('../models/user.model');
const Appointment = require('../models/appointment.model');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * GET /api/doctor/test
 */
const testRoute = (req, res) => {
  return res.status(200).json({ success: true, message: 'Doctor route working' });
};

/**
 * POST /api/doctor/profile  |  PUT /api/doctor/profile
 * Create or update the logged-in doctor's profile (upsert).
 */
const upsertProfile = async (req, res, next) => {
  try {
    const { name, specialization, experience, availability, hospital } = req.body;

    const profile = await Doctor.findOneAndUpdate(
      { user: req.user._id },
      { name, specialization, experience, availability, hospital },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    )
      .populate('user',     'name email role')
      .populate('hospital', 'name address');

    const isNew = profile.createdAt.getTime() === profile.updatedAt.getTime();
    return sendSuccess(res, isNew ? 201 : 200, isNew ? 'Doctor profile created.' : 'Doctor profile updated.', { profile });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/doctor/profile
 * Get the logged-in doctor's own profile (with hospital populated).
 */
const getMyProfile = async (req, res, next) => {
  try {
    const profile = await Doctor.findOne({ user: req.user._id })
      .populate('user',     'name email role')
      .populate('hospital', 'name address phone departments');

    if (!profile) {
      return sendError(res, 404, 'Doctor profile not found. Please create one first.');
    }

    return sendSuccess(res, 200, 'Doctor profile fetched.', { profile });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/doctor  |  GET /api/doctor/all
 * List all doctors — any authenticated user.
 */
const getAllDoctors = async (req, res, next) => {
  try {
    const doctors = await Doctor.find()
      .populate('user',     'name email role isActive')
      .populate('hospital', 'name address phone totalBeds availableBeds departments');

    return sendSuccess(res, 200, 'Doctors fetched.', { doctors });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/doctor/availability
 * Doctor updates their own availability schedule.
 * Body: { availability: [{ day, startTime, endTime }, ...] }
 */
const updateAvailability = async (req, res, next) => {
  try {
    const { availability } = req.body;

    if (!Array.isArray(availability)) {
      return sendError(res, 400, 'availability must be an array of { day, startTime, endTime } objects.');
    }

    const profile = await Doctor.findOneAndUpdate(
      { user: req.user._id },
      { availability },
      { new: true, runValidators: true }
    ).populate('hospital', 'name address');

    if (!profile) {
      return sendError(res, 404, 'Doctor profile not found. Please create your profile first.');
    }

    return sendSuccess(res, 200, 'Availability updated successfully.', { availability: profile.availability });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/doctor/stats
 * Returns appointment counts for the logged-in doctor.
 */
const getDoctorStats = async (req, res, next) => {
  try {
    const doctorUserId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [total, completed, pending, confirmed, todayCount] = await Promise.all([
      Appointment.countDocuments({ doctor: doctorUserId }),
      Appointment.countDocuments({ doctor: doctorUserId, status: 'completed' }),
      Appointment.countDocuments({ doctor: doctorUserId, status: 'pending' }),
      Appointment.countDocuments({ doctor: doctorUserId, status: 'confirmed' }),
      Appointment.countDocuments({ doctor: doctorUserId, date: { $gte: today, $lt: tomorrow } }),
    ]);

    // Unique patients
    const patientIds = await Appointment.distinct('patient', { doctor: doctorUserId });

    return sendSuccess(res, 200, 'Stats fetched.', {
      total,
      completed,
      pending,
      confirmed,
      todayCount,
      totalPatients: patientIds.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/appointments/:id/complete
 * Doctor marks their own appointment as completed.
 */
const completeAppointment = async (req, res, next) => {
  try {
    const appt = await Appointment.findById(req.params.id);
    if (!appt) return sendError(res, 404, 'Appointment not found.');

    if (appt.doctor.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'Not authorized to update this appointment.');
    }
    if (appt.status === 'completed') {
      return sendSuccess(res, 200, 'Appointment already completed.', { appointment: appt });
    }

    appt.status = 'completed';
    await appt.save();
    await appt.populate([
      { path: 'patient', select: 'name email' },
      { path: 'doctor',  select: 'name email specialization' },
    ]);

    return sendSuccess(res, 200, 'Appointment marked as completed.', { appointment: appt });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/doctor/slots?doctorId=<Doctor profile _id OR User _id>&date=YYYY-MM-DD
 *
 * Public-facing slot endpoint used by the booking UI.
 * Accepts EITHER the Doctor profile _id OR the doctor's User _id — resolves both.
 * Returns:
 *   { freeSlots: ['10:00','10:30',...], bookedSlots: ['11:00',...], dayAvailable: true }
 */
const getSlots = async (req, res, next) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId) return sendError(res, 400, 'Query parameter "doctorId" is required.');
    if (!date)     return sendError(res, 400, 'Query parameter "date" is required (YYYY-MM-DD).');

    // Resolve: try Doctor profile first, then fall back to User _id lookup
    let doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      // Maybe doctorId is actually the User _id
      doctor = await Doctor.findOne({ user: doctorId });
    }
    if (!doctor) return sendError(res, 404, 'Doctor not found.');

    // Parse date locally — avoid UTC day-shift
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const [year, month, day] = date.split('-').map(Number);
    const localDate = new Date(year, month - 1, day);
    const dayName   = dayNames[localDate.getDay()];

    // Sunday is always closed unless explicitly configured
    const daySlot = doctor.availability.find(s => s.day === dayName);
    if (!daySlot) {
      return sendSuccess(res, 200, `No availability on ${dayName}.`, {
        freeSlots:    [],
        bookedSlots:  [],
        allSlots:     [],
        dayAvailable: false,
        dayName,
      });
    }

    // Generate all 30-min slots for the day
    const allSlots = [];
    const [startH, startM] = daySlot.startTime.split(':').map(Number);
    const [endH,   endM]   = daySlot.endTime.split(':').map(Number);
    let current = startH * 60 + startM;
    const end   = endH   * 60 + endM;

    while (current + 30 <= end) {
      const h = String(Math.floor(current / 60)).padStart(2, '0');
      const m = String(current % 60).padStart(2, '0');
      allSlots.push(`${h}:${m}`);
      current += 30;
    }

    // Fetch booked slots — query by doctor's User _id (what Appointment stores)
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
    const endOfDay   = new Date(year, month - 1, day, 23, 59, 59, 999);

    const booked = await Appointment.find({
      doctor: doctor.user,          // User _id
      date:   { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'cancelled' },
    }).select('time');

    const bookedTimes = new Set(booked.map(a => a.time));
    const bookedSlots = allSlots.filter(s =>  bookedTimes.has(s));
    const freeSlots   = allSlots.filter(s => !bookedTimes.has(s));

    return sendSuccess(res, 200, 'Slots fetched.', {
      freeSlots,
      bookedSlots,
      allSlots,
      dayAvailable: true,
      dayName,
      startTime: daySlot.startTime,
      endTime:   daySlot.endTime,
      doctorUserId: doctor.user,   // expose User _id so frontend can use it for booking
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/doctor/availability/:doctorId?date=YYYY-MM-DD
 * Legacy endpoint — kept for backward compatibility.
 * Delegates to the same slot logic.
 */
const getDoctorAvailability = async (req, res, next) => {
  // Reuse getSlots logic by forwarding params
  req.query.doctorId = req.params.doctorId;
  return getSlots(req, res, next);
};

/**
 * GET /api/doctor/reports?days=30
 * Detailed analytics for the logged-in doctor.
 */
const getDoctorReports = async (req, res, next) => {
  try {
    const doctorUserId = req.user._id;
    const days  = Math.min(Number(req.query.days) || 30, 90);
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const [
      apptTrend,
      apptByStatus,
      recentAppointments,
      totalCount,
      completedCount,
      pendingCount,
      confirmedCount,
    ] = await Promise.all([
      // Appointments booked per day in window
      Appointment.aggregate([
        { $match: { doctor: doctorUserId, createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),

      // Status breakdown
      Appointment.aggregate([
        { $match: { doctor: doctorUserId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      // Recent 10 appointments
      Appointment.find({ doctor: doctorUserId })
        .populate('patient', 'name email')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),

      Appointment.countDocuments({ doctor: doctorUserId }),
      Appointment.countDocuments({ doctor: doctorUserId, status: 'completed' }),
      Appointment.countDocuments({ doctor: doctorUserId, status: 'pending' }),
      Appointment.countDocuments({ doctor: doctorUserId, status: 'confirmed' }),
    ]);

    const statusMap = {};
    apptByStatus.forEach(s => { statusMap[s._id] = s.count; });

    // Unique patients
    const patientIds = await Appointment.distinct('patient', { doctor: doctorUserId });

    // Revenue estimate: completed × ₹500
    const revenueEstimate = completedCount * 500;

    // Activity log from recent appointments
    const activityLog = recentAppointments.map(a => ({
      icon:      a.status === 'completed' ? 'check-circle' : a.status === 'cancelled' ? 'times-circle' : 'calendar',
      color:     a.status === 'completed' ? 'success' : a.status === 'cancelled' ? 'secondary' : 'primary',
      text:      `${a.patient?.name || 'Patient'} — ${a.status}`,
      date:      a.date,
      time:      a.time,
      timestamp: a.createdAt,
    }));

    return sendSuccess(res, 200, 'Doctor reports fetched.', {
      apptTrend,
      statusMap,
      totalCount,
      completedCount,
      pendingCount,
      confirmedCount,
      totalPatients: patientIds.length,
      revenueEstimate,
      activityLog,
      windowDays: days,
    });
  } catch (error) {
    next(error);
  }
};
const askDoctorQuestion = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const { question } = req.body;

    if (!question || !question.trim()) return sendError(res, 400, 'Question text is required.');

    const doctor = await Doctor.findById(doctorId).populate('user', 'name');
    if (!doctor) return sendError(res, 404, 'Doctor not found.');

    console.log(`[Question] From user ${req.user._id} to Dr. ${doctor.name}: ${question}`);
    return sendSuccess(res, 200, `Your question has been sent to Dr. ${doctor.name}.`, {});
  } catch (error) {
    next(error);
  }
};

module.exports = {
  testRoute,
  upsertProfile,
  getMyProfile,
  getAllDoctors,
  updateAvailability,
  getDoctorStats,
  getDoctorReports,
  completeAppointment,
  getSlots,
  getDoctorAvailability,
  askDoctorQuestion,
};
