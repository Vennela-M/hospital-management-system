const express = require('express');
const { getAllUsers, getUserById, deactivateUser } = require('../controllers/user.controller');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const ROLES = require('../config/roles');

const router = express.Router();

// All user routes require authentication
router.use(authenticate);

router.get('/', authorize(ROLES.ADMIN), getAllUsers);
router.get('/:id', getUserById);                                      // admin or self
router.patch('/:id/deactivate', authorize(ROLES.ADMIN), deactivateUser);

module.exports = router;
