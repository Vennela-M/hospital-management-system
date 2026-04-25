const Patient = require('../models/patient.model');
const { sendSuccess, sendError } = require('../utils/response');
const { checkCriticalCondition, checkOutbreak } = require('../services/alert.service');

/**
 * GET /api/patient/test
 * Health-check for the patient route group.
 */
const testRoute = (req, res) => {
  return res.status(200).json({ success: true, message: 'Patient route working' });
};

/**
 * PUT /api/patients/profile  |  POST /api/patient/profile
 * Create or update the logged-in patient's profile (upsert).
 */
const upsertProfile = async (req, res, next) => {
  try {
    const { age, gender, phone, height, weight, bloodGroup, allergies, chronicDiseases } =
      req.body;

    const profile = await Patient.findOneAndUpdate(
      { user: req.user._id },
      { age, gender, phone, height, weight, bloodGroup, allergies, chronicDiseases },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).populate('user', 'name email role');

    const statusCode = profile.createdAt === profile.updatedAt ? 201 : 200;
    const message =
      statusCode === 201 ? 'Patient profile created.' : 'Patient profile updated.';

    // ── AI Alert hooks ────────────────────────────────────────────────────
    // Run asynchronously — do not block the HTTP response
    checkCriticalCondition(profile).catch((e) =>
      console.error('[Alert] Critical check failed:', e.message)
    );
    checkOutbreak(profile.chronicDiseases).catch((e) =>
      console.error('[Alert] Outbreak check failed:', e.message)
    );

    return sendSuccess(res, statusCode, message, { profile });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/patient/profile
 * Get the logged-in patient's profile.
 * If no profile exists yet, auto-create an empty one and return it.
 */
const getMyProfile = async (req, res, next) => {
  try {
    let profile = await Patient.findOne({ user: req.user._id }).populate(
      'user',
      'name email role'
    );

    // Auto-create if missing (handles patients registered before this fix)
    if (!profile) {
      profile = await Patient.create({ user: req.user._id });
      await profile.populate('user', 'name email role');
    }

    return sendSuccess(res, 200, 'Patient profile fetched.', { profile });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/patients/:userId/profile
 * Admin or Doctor — get any patient's profile by userId.
 */
const getProfileByUserId = async (req, res, next) => {
  try {
    const profile = await Patient.findOne({ user: req.params.userId }).populate(
      'user',
      'name email role'
    );

    if (!profile) {
      return sendError(res, 404, 'Patient profile not found.');
    }

    return sendSuccess(res, 200, 'Patient profile fetched.', { profile });
  } catch (error) {
    next(error);
  }
};

module.exports = { testRoute, upsertProfile, getMyProfile, getProfileByUserId };
