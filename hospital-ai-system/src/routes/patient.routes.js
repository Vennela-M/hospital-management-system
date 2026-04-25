const express = require('express');
const {
  testRoute,
  upsertProfile,
  getMyProfile,
  getProfileByUserId,
} = require('../controllers/patient.controller');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const { patientProfileValidator } = require('../validators/patient.validator');
const ROLES = require('../config/roles');

const router = express.Router();

// ── Public health-check ──────────────────────────────────────────────────────
router.get('/test', testRoute);

// ── All routes below require a valid JWT ────────────────────────────────────
router.use(authenticate);

// Patient: create or update their own profile
router.post('/profile', authorize(ROLES.PATIENT), validate(patientProfileValidator), upsertProfile);
router.put('/profile',  authorize(ROLES.PATIENT), validate(patientProfileValidator), upsertProfile);

// Patient: read their own profile
router.get('/profile', authorize(ROLES.PATIENT), getMyProfile);

// Doctor / Admin: read any patient's profile by userId
router.get('/:userId/profile', authorize(ROLES.DOCTOR, ROLES.ADMIN), getProfileByUserId);

module.exports = router;
