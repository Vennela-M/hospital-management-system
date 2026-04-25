const crypto = require('crypto');
const User        = require('../models/user.model');
const Doctor      = require('../models/doctor.model');
const DoctorCode  = require('../models/doctorCode.model');
const Hospital    = require('../models/hospital.model');
const Appointment = require('../models/appointment.model');
const { signToken } = require('../utils/jwt');
const { sendSuccess, sendError } = require('../utils/response');
const ROLES = require('../config/roles');

// ─────────────────────────────────────────────────────────────────────────────
// USER MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/users
 * List all users with optional role filter and pagination.
 */
const listUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 50, search } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name:  { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      User.countDocuments(filter),
    ]);
    return sendSuccess(res, 200, 'Users fetched.', {
      users,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) { next(error); }
};

/**
 * GET /api/admin/users/:id
 */
const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return sendError(res, 404, 'User not found.');
    return sendSuccess(res, 200, 'User fetched.', { user });
  } catch (error) { next(error); }
};

/**
 * PUT /api/admin/users/:id
 * Admin updates a user's name, email, role, or isActive status.
 */
const updateUser = async (req, res, next) => {
  try {
    const { name, email, role, isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, isActive },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) return sendError(res, 404, 'User not found.');
    return sendSuccess(res, 200, 'User updated.', { user });
  } catch (error) { next(error); }
};

/**
 * DELETE /api/admin/users/:id
 * Hard-delete a user (and their Doctor/Patient profile if present).
 */
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 404, 'User not found.');
    if (user._id.toString() === req.user._id.toString()) {
      return sendError(res, 400, 'You cannot delete your own account.');
    }
    // Remove linked Doctor profile if exists
    if (user.role === ROLES.DOCTOR) {
      await Doctor.deleteOne({ user: user._id });
    }
    await User.deleteOne({ _id: user._id });
    return sendSuccess(res, 200, 'User deleted.', {});
  } catch (error) { next(error); }
};

// ─────────────────────────────────────────────────────────────────────────────
// HOSPITAL LOGIN ACCOUNT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/admin/create-hospital-login
 * Creates a User with role=hospital linked to an existing Hospital document.
 * The hospital can then log in via POST /api/auth/login.
 */
const createHospitalLogin = async (req, res, next) => {
  try {
    const { hospitalId, email, password, name } = req.body;
    if (!hospitalId || !email || !password) {
      return sendError(res, 400, 'hospitalId, email and password are required.');
    }
    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) return sendError(res, 404, 'Hospital not found.');

    const existing = await User.findOne({ email });
    if (existing) return sendError(res, 409, 'Email is already registered.');

    const user = await User.create({
      name: name || hospital.name,
      email,
      password,
      role: ROLES.HOSPITAL,
      hospitalRef: hospitalId,
    });

    return sendSuccess(res, 201, 'Hospital login account created.', {
      loginEmail: email,
      hospitalName: hospital.name,
      userId: user._id,
    });
  } catch (error) { next(error); }
};

// ─────────────────────────────────────────────────────────────────────────────
// ASSIGN DOCTOR TO HOSPITAL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/admin/hospitals/:id/assign-doctor
 * Adds a Doctor profile reference to a hospital's doctors array.
 */
const assignDoctorToHospital = async (req, res, next) => {
  try {
    const { doctorId } = req.body;   // Doctor profile _id
    if (!doctorId) return sendError(res, 400, 'doctorId is required.');

    const [hospital, doctor] = await Promise.all([
      Hospital.findById(req.params.id),
      Doctor.findById(doctorId),
    ]);
    if (!hospital) return sendError(res, 404, 'Hospital not found.');
    if (!doctor)   return sendError(res, 404, 'Doctor not found.');

    if (hospital.doctors.map(String).includes(String(doctorId))) {
      return sendSuccess(res, 200, 'Doctor already assigned to this hospital.', { hospital });
    }

    hospital.doctors.push(doctorId);
    await hospital.save();
    await hospital.populate('doctors', 'name specialization experience');

    // Update department doctor counts
    await updateDepartmentCounts(hospital._id);

    return sendSuccess(res, 200, 'Doctor assigned to hospital.', { hospital });
  } catch (error) { next(error); }
};

/**
 * DELETE /api/admin/hospitals/:id/assign-doctor/:doctorId
 * Removes a doctor from a hospital.
 */
const removeDoctorFromHospital = async (req, res, next) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) return sendError(res, 404, 'Hospital not found.');

    hospital.doctors = hospital.doctors.filter(d => String(d) !== req.params.doctorId);
    await hospital.save();
    await hospital.populate('doctors', 'name specialization experience');

    // Update department doctor counts
    await updateDepartmentCounts(hospital._id);

    return sendSuccess(res, 200, 'Doctor removed from hospital.', { hospital });
  } catch (error) { next(error); }
};

// Helper function to update department doctor counts
async function updateDepartmentCounts(hospitalId) {
  const hospital = await Hospital.findById(hospitalId);
  if (!hospital) return;

  // Count doctors per department (simplified: all doctors count toward first department)
  // In a real system, doctors would be assigned to specific departments
  const doctorCount = hospital.doctors.length;
  
  // Update each department with doctor count and bed count
  hospital.departments = hospital.departments.map(d => ({
    ...d,
    doctorCount,
    bedCount: hospital.availableBeds || 0,
  }));

  await hospital.save();
}

// ─────────────────────────────────────────────────────────────────────────────
// APPOINTMENT MANAGEMENT (admin view)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/appointments
 * All appointments with full patient + doctor population.
 */
const listAppointments = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;

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
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) { next(error); }
};

/**
 * PATCH /api/admin/appointments/:id/status
 * Admin updates appointment status.
 */
const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const VALID = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!VALID.includes(status)) return sendError(res, 400, `Status must be one of: ${VALID.join(', ')}`);

    const appt = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('patient', 'name email').populate('doctor', 'name email');

    if (!appt) return sendError(res, 404, 'Appointment not found.');
    return sendSuccess(res, 200, 'Appointment status updated.', { appointment: appt });
  } catch (error) { next(error); }
};

/**
 * POST /api/admin/create-doctor
 * Admin directly creates a doctor account (User + Doctor profile).
 */
const createDoctor = async (req, res, next) => {
  try {
    const { name, email, password, specialization, experience, phone } = req.body;

    if (!name || !email || !password || !specialization || experience === undefined) {
      return sendError(res, 400, 'name, email, password, specialization and experience are required.');
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return sendError(res, 409, 'Email is already registered.');
    }

    // Create the User account
    const user = await User.create({
      name,
      email,
      password,
      role: ROLES.DOCTOR,
    });

    // Create the Doctor profile
    const doctor = await Doctor.create({
      user: user._id,
      name,
      specialization,
      experience: Number(experience),
      availability: [],
    });

    await doctor.populate('user', 'name email role');

    return sendSuccess(res, 201, 'Doctor account created successfully.', {
      doctor,
      loginEmail: email,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/generate-doctor-code
 * Admin generates a one-time registration code for a doctor to self-register.
 */
const generateDoctorCode = async (req, res, next) => {
  try {
    const { name, email, specialization, experience } = req.body;

    if (!name || !email || !specialization || experience === undefined) {
      return sendError(res, 400, 'name, email, specialization and experience are required.');
    }

    // Check email not already taken
    const existing = await User.findOne({ email });
    if (existing) {
      return sendError(res, 409, 'A user with this email already exists.');
    }

    // Check no active unused code for this email
    const activeCode = await DoctorCode.findOne({ email, used: false, expiresAt: { $gt: new Date() } });
    if (activeCode) {
      return sendSuccess(res, 200, 'An active code already exists for this email.', {
        code: activeCode.code,
        expiresAt: activeCode.expiresAt,
      });
    }

    // Generate a readable 8-char alphanumeric code
    const code = crypto.randomBytes(4).toString('hex').toUpperCase(); // e.g. "A3F9C12B"

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const doctorCode = await DoctorCode.create({
      code,
      name,
      email,
      specialization,
      experience: Number(experience),
      expiresAt,
      createdBy: req.user._id,
    });

    return sendSuccess(res, 201, 'Doctor registration code generated.', {
      code: doctorCode.code,
      name,
      email,
      specialization,
      experience,
      expiresAt: doctorCode.expiresAt,
      instructions: `Share this code with the doctor. They can register at /api/admin/register-with-code using this code and their chosen password.`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/register-with-code   (PUBLIC — no auth required)
 * Doctor self-registers using a code generated by admin.
 */
const registerWithCode = async (req, res, next) => {
  try {
    const { code, password } = req.body;

    if (!code || !password) {
      return sendError(res, 400, 'code and password are required.');
    }

    if (password.length < 8) {
      return sendError(res, 400, 'Password must be at least 8 characters.');
    }

    const doctorCode = await DoctorCode.findOne({ code: code.toUpperCase() });

    if (!doctorCode) {
      return sendError(res, 404, 'Invalid registration code.');
    }
    if (doctorCode.used) {
      return sendError(res, 409, 'This registration code has already been used.');
    }
    if (doctorCode.expiresAt < new Date()) {
      return sendError(res, 410, 'This registration code has expired.');
    }

    // Check email not already taken (race condition guard)
    const existing = await User.findOne({ email: doctorCode.email });
    if (existing) {
      return sendError(res, 409, 'Email is already registered.');
    }

    // Create User
    const user = await User.create({
      name: doctorCode.name,
      email: doctorCode.email,
      password,
      role: ROLES.DOCTOR,
    });

    // Create Doctor profile
    const doctor = await Doctor.create({
      user: user._id,
      name: doctorCode.name,
      specialization: doctorCode.specialization,
      experience: doctorCode.experience,
      availability: [],
    });

    // Mark code as used
    doctorCode.used = true;
    doctorCode.usedBy = user._id;
    await doctorCode.save();

    const token = signToken({ id: user._id, role: user.role });

    return sendSuccess(res, 201, 'Doctor account created successfully. You can now log in.', {
      token,
      user,
      doctor,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/doctors
 * Admin lists all doctors with their User info.
 */
const listDoctors = async (req, res, next) => {
  try {
    const doctors = await Doctor.find()
      .populate('user', 'name email role isActive createdAt')
      .populate('hospital', 'name address phone totalBeds availableBeds departments')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Doctors fetched.', { doctors });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/doctor-codes
 * Admin lists all generated registration codes.
 */
const listDoctorCodes = async (req, res, next) => {
  try {
    const codes = await DoctorCode.find()
      .populate('createdBy', 'name email')
      .populate('usedBy', 'name email')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Doctor codes fetched.', { codes });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// HOSPITAL MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/admin/create-hospital  (also aliased as POST /api/hospital)
 */
const createHospital = async (req, res, next) => {
  try {
    const { name, address, phone, email, website, description, totalBeds, availableBeds, departments } = req.body;

    if (!name || !address) {
      return sendError(res, 400, 'name and address are required.');
    }

    const hospital = await Hospital.create({
      name,
      address,
      phone,
      email,
      website,
      description,
      totalBeds: Number(totalBeds) || 0,
      availableBeds: Number(availableBeds) || 0,
      departments: departments || [],
      createdBy: req.user._id,
    });

    return sendSuccess(res, 201, 'Hospital created successfully.', { hospital });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/hospitals  (also aliased as GET /api/hospital)
 * Populates doctors with full availability so the hospital dashboard works.
 */
const listHospitals = async (req, res, next) => {
  try {
    const hospitals = await Hospital.find()
      .populate({
        path: 'doctors',
        select: 'name specialization experience availability',
      })
      .sort({ createdAt: -1 });

    // Update department counts for each hospital
    const hospitalsWithCounts = hospitals.map(h => {
      const doctorCount = (h.doctors || []).length;
      return {
        ...h.toObject(),
        departments: (h.departments || []).map(d => ({
          ...d,
          doctorCount,
          bedCount: h.availableBeds || 0,
        })),
      };
    });

    return sendSuccess(res, 200, 'Hospitals fetched.', { hospitals: hospitalsWithCounts });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/hospitals/:id  (also aliased as GET /api/hospital/:id)
 */
const getHospital = async (req, res, next) => {
  try {
    const hospital = await Hospital.findById(req.params.id)
      .populate({
        path: 'doctors',
        select: 'name specialization experience availability',
      });

    if (!hospital) {
      return sendError(res, 404, 'Hospital not found.');
    }

    // Update department counts
    const doctorCount = (hospital.doctors || []).length;
    const departmentsWithCounts = (hospital.departments || []).map(d => ({
      ...d,
      doctorCount,
      bedCount: hospital.availableBeds || 0,
    }));

    return sendSuccess(res, 200, 'Hospital fetched.', { 
      hospital: {
        ...hospital.toObject(),
        departments: departmentsWithCounts,
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/hospitals/:id  (also aliased as PUT /api/hospital/:id)
 */
const updateHospital = async (req, res, next) => {
  try {
    const { name, address, phone, email, website, description, totalBeds, availableBeds } = req.body;

    const hospital = await Hospital.findByIdAndUpdate(
      req.params.id,
      { name, address, phone, email, website, description, totalBeds, availableBeds },
      { new: true, runValidators: true }
    );

    if (!hospital) {
      return sendError(res, 404, 'Hospital not found.');
    }

    return sendSuccess(res, 200, 'Hospital updated.', { hospital });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/hospitals/:id  (also aliased as DELETE /api/hospital/:id)
 */
const deleteHospital = async (req, res, next) => {
  try {
    const hospital = await Hospital.findByIdAndDelete(req.params.id);

    if (!hospital) {
      return sendError(res, 404, 'Hospital not found.');
    }

    return sendSuccess(res, 200, 'Hospital deleted.', {});
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/hospitals/:id/departments
 */
const addDepartment = async (req, res, next) => {
  try {
    const { name, head } = req.body;

    if (!name) {
      return sendError(res, 400, 'Department name is required.');
    }

    const hospital = await Hospital.findByIdAndUpdate(
      req.params.id,
      { $push: { departments: { name, head, doctorCount: 0, bedCount: 0 } } },
      { new: true, runValidators: true }
    );

    if (!hospital) {
      return sendError(res, 404, 'Hospital not found.');
    }

    // Update department counts
    await updateDepartmentCounts(hospital._id);

    return sendSuccess(res, 200, 'Department added.', { hospital });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/hospitals/:id/departments/:index
 */
const deleteDepartment = async (req, res, next) => {
  try {
    const hospital = await Hospital.findById(req.params.id);

    if (!hospital) {
      return sendError(res, 404, 'Hospital not found.');
    }

    const index = Number(req.params.index);
    if (isNaN(index) || index < 0 || index >= hospital.departments.length) {
      return sendError(res, 400, 'Invalid department index.');
    }

    hospital.departments.splice(index, 1);
    await hospital.save();

    // Update department counts
    await updateDepartmentCounts(hospital._id);

    return sendSuccess(res, 200, 'Department removed.', { hospital });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/stats
 * Quick dashboard stats for the admin UI.
 */
const getStats = async (req, res, next) => {
  try {
    const [totalUsers, totalDoctors, totalHospitals, totalAppointments,
           completedAppointments, pendingAppointments] = await Promise.all([
      User.countDocuments(),
      Doctor.countDocuments(),
      Hospital.countDocuments(),
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: 'completed' }),
      Appointment.countDocuments({ status: 'pending' }),
    ]);

    return sendSuccess(res, 200, 'Stats fetched.', {
      totalUsers,
      totalDoctors,
      totalHospitals,
      totalAppointments,
      completedAppointments,
      pendingAppointments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/reports
 * Comprehensive analytics for the system reports page.
 * Query params:
 *   days=14  (default 14, max 90) — window for trend data
 */
const getReports = async (req, res, next) => {
  try {
    const days = Math.min(Number(req.query.days) || 14, 90);
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const [
      userTrend,
      patientTrend,
      apptTrend,
      apptStats,
      roleBreakdown,
      recentAppointments,
      recentRegistrations,
      totalPatients,
      newPatientsThisMonth,
    ] = await Promise.all([

      // ── User registrations per day ──────────────────────────────────────
      User.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),

      // ── New patient registrations per day ───────────────────────────────
      User.aggregate([
        { $match: { role: ROLES.PATIENT, createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),

      // ── Appointments booked per day ─────────────────────────────────────
      Appointment.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),

      // ── Appointment status breakdown ────────────────────────────────────
      Appointment.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      // ── User role breakdown ─────────────────────────────────────────────
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),

      // ── Recent activity: last 10 appointments ───────────────────────────
      Appointment.find()
        .populate('patient', 'name')
        .populate('doctor',  'name specialization')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),

      // ── Recent activity: last 10 user registrations ─────────────────────
      User.find()
        .select('name role createdAt')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),

      // ── Total patients ──────────────────────────────────────────────────
      User.countDocuments({ role: ROLES.PATIENT }),

      // ── New patients this calendar month ───────────────────────────────
      User.countDocuments({
        role: ROLES.PATIENT,
        createdAt: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      }),
    ]);

    // ── Reshape ──────────────────────────────────────────────────────────
    const apptByStatus = {};
    apptStats.forEach(s => { apptByStatus[s._id] = s.count; });

    const roleMap = {};
    roleBreakdown.forEach(r => { roleMap[r._id] = r.count; });

    // ── Revenue estimate: completed appointments × ₹500 ─────────────────
    const completedCount   = apptByStatus.completed || 0;
    const revenueEstimate  = completedCount * 500;

    // ── Merge recent activity into a single sorted log ───────────────────
    const activityLog = [
      ...recentAppointments.map(a => ({
        type:      'appointment',
        icon:      'calendar-check',
        color:     a.status === 'completed' ? 'success' : a.status === 'cancelled' ? 'secondary' : 'primary',
        text:      `${a.patient?.name || 'Patient'} booked with Dr. ${a.doctor?.name || 'Doctor'} (${a.status})`,
        timestamp: a.createdAt,
      })),
      ...recentRegistrations.map(u => ({
        type:      'registration',
        icon:      'user-plus',
        color:     u.role === 'doctor' ? 'info' : u.role === 'admin' ? 'warning' : 'success',
        text:      `${u.name} registered as ${u.role}`,
        timestamp: u.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 15);

    return sendSuccess(res, 200, 'Reports fetched.', {
      // Trend data (arrays of { _id: 'YYYY-MM-DD', count: N })
      userTrend,
      patientTrend,
      apptTrend,
      // Breakdowns
      apptByStatus,
      roleMap,
      // Patient stats
      totalPatients,
      newPatientsThisMonth,
      // Revenue
      revenueEstimate,
      completedAppointments: completedCount,
      // Activity log
      activityLog,
      // Meta
      windowDays: days,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // User management
  listUsers,
  getUser,
  updateUser,
  deleteUser,
  // Doctor management
  createDoctor,
  generateDoctorCode,
  registerWithCode,
  listDoctors,
  listDoctorCodes,
  // Hospital management
  createHospital,
  createHospitalLogin,
  listHospitals,
  getHospital,
  updateHospital,
  deleteHospital,
  addDepartment,
  deleteDepartment,
  assignDoctorToHospital,
  removeDoctorFromHospital,
  // Appointment management
  listAppointments,
  updateAppointmentStatus,
  // Stats / reports
  getStats,
  getReports,
};
