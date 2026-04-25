const express = require('express');
const {
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
} = require('../controllers/admin.controller');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const ROLES = require('../config/roles');

const router = express.Router();

// ── Public ───────────────────────────────────────────────────────────────────
router.post('/register-with-code', registerWithCode);

// ── All routes below require admin JWT ───────────────────────────────────────
router.use(authenticate);
router.use(authorize(ROLES.ADMIN));

// Stats & reports
router.get('/stats',   getStats);
router.get('/reports', getReports);

// User management
router.get('/users',          listUsers);
router.get('/users/:id',      getUser);
router.put('/users/:id',      updateUser);
router.delete('/users/:id',   deleteUser);

// Doctor management
router.post('/create-doctor',         createDoctor);
router.post('/generate-doctor-code',  generateDoctorCode);
router.get('/doctors',                listDoctors);
router.get('/doctor-codes',           listDoctorCodes);

// Hospital management
router.post('/create-hospital',                          createHospital);
router.post('/create-hospital-login',                    createHospitalLogin);
router.get('/hospitals',                                 listHospitals);
router.get('/hospitals/:id',                             getHospital);
router.put('/hospitals/:id',                             updateHospital);
router.delete('/hospitals/:id',                          deleteHospital);
router.post('/hospitals/:id/departments',                addDepartment);
router.delete('/hospitals/:id/departments/:index',       deleteDepartment);
router.post('/hospitals/:id/assign-doctor',              assignDoctorToHospital);
router.delete('/hospitals/:id/assign-doctor/:doctorId',  removeDoctorFromHospital);

// Appointment management
router.get('/appointments',              listAppointments);
router.patch('/appointments/:id/status', updateAppointmentStatus);

module.exports = router;
