const express = require('express');
const {
  addReport,
  getMyReports,
  getReportsByPatientId,
  getReportFile,
} = require('../controllers/medicalReport.controller');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const { addReportValidator } = require('../validators/medicalReport.validator');
const ROLES = require('../config/roles');

const router = express.Router();

router.use(authenticate);

router.post('/', authorize(ROLES.PATIENT, ROLES.DOCTOR, ROLES.ADMIN), validate(addReportValidator), addReport);
router.get('/',  authorize(ROLES.PATIENT), getMyReports);

// Single file download — must come BEFORE /:patientId to avoid route conflict
router.get('/file/:id', authorize(ROLES.PATIENT, ROLES.DOCTOR, ROLES.ADMIN), getReportFile);

router.get('/:patientId', authorize(ROLES.DOCTOR, ROLES.ADMIN), getReportsByPatientId);

module.exports = router;
