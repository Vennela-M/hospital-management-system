const express = require('express');
const {
  testRoute,
  createAlert,
  getMyAlerts,
  markAsRead,
  markAllAsRead,
  listAllAlerts,
  deleteAlert,
  bulkDeleteAlerts,
} = require('../controllers/alert.controller');
const authenticate = require('../middlewares/authenticate');
const authorize    = require('../middlewares/authorize');
const validate     = require('../middlewares/validate');
const { createAlertValidator } = require('../validators/alert.validator');
const ROLES = require('../config/roles');

const router = express.Router();

router.get('/test', testRoute);

router.use(authenticate);

// ── Admin-only ────────────────────────────────────────────────────────────────
// Send alert (single user, list, or by role)
router.post('/',           authorize(ROLES.ADMIN), validate(createAlertValidator), createAlert);

// List all alerts (admin view — all users, with search/filter)
router.get('/admin/all',   authorize(ROLES.ADMIN), listAllAlerts);

// Delete a single alert
router.delete('/:id',      authorize(ROLES.ADMIN), deleteAlert);

// Bulk-delete alerts
router.delete('/',         authorize(ROLES.ADMIN), bulkDeleteAlerts);

// ── Any authenticated user ────────────────────────────────────────────────────
// Get own alerts (with unread count)
router.get('/', getMyAlerts);

// Mark all as read
router.patch('/read-all', markAllAsRead);

// Mark one as read
router.patch('/:id/read', markAsRead);

module.exports = router;
