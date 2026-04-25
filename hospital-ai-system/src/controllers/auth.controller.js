const User    = require('../models/user.model');
const Patient = require('../models/patient.model');
const Doctor  = require('../models/doctor.model');
const { signToken } = require('../utils/jwt');
const { sendSuccess, sendError } = require('../utils/response');
const ROLES = require('../config/roles');

/**
 * POST /api/auth/register
 * Register a new user. Automatically creates a Patient profile for patient role.
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, specialization, licenseNumber } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, 409, 'Email is already registered.');
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      specialization,
      licenseNumber,
    });

    // Auto-create an empty Patient profile so GET /api/patient/profile never 404s
    if (user.role === ROLES.PATIENT) {
      await Patient.create({ user: user._id });
    }

    const token = signToken({ id: user._id, role: user.role });

    return sendSuccess(res, 201, 'Registration successful.', { token, user });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Authenticate a user and return a JWT.
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Explicitly select password since it's excluded by default
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return sendError(res, 401, 'Invalid email or password.');
    }

    if (!user.isActive) {
      return sendError(res, 403, 'Your account has been deactivated.');
    }

    const token = signToken({ id: user._id, role: user.role });

    // Strip password before sending
    user.password = undefined;

    return sendSuccess(res, 200, 'Login successful.', { token, user });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Return the currently authenticated user.
 */
const getMe = async (req, res) => {
  return sendSuccess(res, 200, 'User profile fetched.', { user: req.user });
};

/**
 * POST /api/auth/admin/doctor-login
 * Admin impersonates a doctor — returns a doctor-scoped JWT.
 * Accepts either { doctorId, password } or { email, password }.
 */
const adminDoctorLogin = async (req, res, next) => {
  try {
    const { doctorId, email, password } = req.body;

    if (!password) {
      return sendError(res, 400, 'Password is required.');
    }

    // Find the doctor's User account
    let user;
    if (email) {
      user = await User.findOne({ email, role: ROLES.DOCTOR }).select('+password');
    } else if (doctorId) {
      // doctorId may be the Doctor profile _id or the User _id
      const doctorProfile = await Doctor.findById(doctorId);
      if (doctorProfile) {
        user = await User.findById(doctorProfile.user).select('+password');
      } else {
        user = await User.findById(doctorId).select('+password');
      }
    }

    if (!user || user.role !== ROLES.DOCTOR) {
      return sendError(res, 404, 'Doctor not found.');
    }

    const passwordOk = await user.comparePassword(password);
    if (!passwordOk) {
      return sendError(res, 401, 'Incorrect password.');
    }

    if (!user.isActive) {
      return sendError(res, 403, 'Doctor account is deactivated.');
    }

    const token = signToken({ id: user._id, role: user.role });
    user.password = undefined;

    // Also fetch the Doctor profile for the frontend
    const doctor = await Doctor.findOne({ user: user._id });

    return sendSuccess(res, 200, 'Doctor login successful.', { token, user, doctor });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, adminDoctorLogin };
