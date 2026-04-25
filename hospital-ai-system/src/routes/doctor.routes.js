const express = require('express');
const {
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
} = require('../controllers/doctor.controller');
const authenticate  = require('../middlewares/authenticate');
const authorize     = require('../middlewares/authorize');
const validate      = require('../middlewares/validate');
const { doctorProfileValidator } = require('../validators/doctor.validator');
const ROLES = require('../config/roles');

const router = express.Router();

// ── Public ───────────────────────────────────────────────────────────────────
router.get('/test', testRoute);

// ── All routes below require a valid JWT ─────────────────────────────────────
router.use(authenticate);

// Any authenticated user: list all doctors
router.get('/',    authorize(ROLES.PATIENT, ROLES.DOCTOR, ROLES.ADMIN, ROLES.HOSPITAL), getAllDoctors);
router.get('/all', authorize(ROLES.PATIENT, ROLES.DOCTOR, ROLES.ADMIN, ROLES.HOSPITAL), getAllDoctors);

// Slot availability — dedicated endpoint used by booking UI
// GET /api/doctor/slots?doctorId=<Doctor _id or User _id>&date=YYYY-MM-DD
router.get('/slots', authorize(ROLES.PATIENT, ROLES.DOCTOR, ROLES.ADMIN, ROLES.HOSPITAL), getSlots);

// Legacy availability endpoint (kept for backward compat)
router.get('/availability/:doctorId', authorize(ROLES.PATIENT, ROLES.DOCTOR, ROLES.ADMIN, ROLES.HOSPITAL), getDoctorAvailability);

// Doctor: own stats
router.get('/stats',   authorize(ROLES.DOCTOR), getDoctorStats);
// Doctor: own reports & analytics
router.get('/reports', authorize(ROLES.DOCTOR), getDoctorReports);

// Doctor: update own availability
router.put('/availability', authorize(ROLES.DOCTOR), updateAvailability);

// Doctor: mark appointment complete
router.patch('/appointments/:id/complete', authorize(ROLES.DOCTOR), completeAppointment);

// Patient: send question to a doctor
router.post('/:doctorId/questions', authorize(ROLES.PATIENT), askDoctorQuestion);

// Doctor: create or update own profile
router.post('/profile', authorize(ROLES.DOCTOR), validate(doctorProfileValidator), upsertProfile);
router.put('/profile',  authorize(ROLES.DOCTOR), validate(doctorProfileValidator), upsertProfile);

// Doctor: read own profile
router.get('/profile', authorize(ROLES.DOCTOR), getMyProfile);

module.exports = router;
