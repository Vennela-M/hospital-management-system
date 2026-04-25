const express = require('express');
const {
  bookAppointment,
  getMyAppointments,
  cancelAppointment,
} = require('../controllers/appointment.controller');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const { bookAppointmentValidator } = require('../validators/appointment.validator');
const ROLES = require('../config/roles');

const router = express.Router();

// All appointment routes require authentication
router.use(authenticate);

router.post('/',           authorize(ROLES.PATIENT), validate(bookAppointmentValidator), bookAppointment);
router.get('/',            authorize(ROLES.PATIENT, ROLES.DOCTOR, ROLES.ADMIN), getMyAppointments);
router.patch('/:id/cancel', authorize(ROLES.PATIENT), cancelAppointment);

module.exports = router;
