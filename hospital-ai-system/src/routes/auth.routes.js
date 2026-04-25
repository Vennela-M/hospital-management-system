const express = require('express');
const { register, login, getMe, adminDoctorLogin } = require('../controllers/auth.controller');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const { registerValidator, loginValidator } = require('../validators/auth.validator');
const ROLES = require('../config/roles');

const router = express.Router();

router.post('/register', validate(registerValidator), register);
router.post('/login', validate(loginValidator), login);
router.get('/me', authenticate, getMe);

// Admin impersonates a doctor
router.post('/admin/doctor-login', authenticate, authorize(ROLES.ADMIN), adminDoctorLogin);

module.exports = router;
