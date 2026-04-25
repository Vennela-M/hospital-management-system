const Alert = require('../models/alert.model');
const User  = require('../models/user.model');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * GET /api/alerts/test
 */
const testRoute = (req, res) => {
  return res.status(200).json({ success: true, message: 'Alert route working' });
};

// ─── Helper: emit via socket if available ────────────────────────────────────
const _emit = (userId, alertDoc) => {
  try {
    const { getIO } = require('../utils/socket');
    getIO().to(userId.toString()).emit('alert', {
      _id:       alertDoc._id,
      message:   alertDoc.message,
      type:      alertDoc.type,
      status:    alertDoc.status,
      createdAt: alertDoc.createdAt,
    });
  } catch (_) { /* socket not initialised — skip */ }
};

// ─── Helper: resolve recipient User IDs from request body ────────────────────
const _resolveRecipients = async ({ userId, userIds, targetRole }) => {
  // Single user
  if (userId) return [userId];

  // Explicit list
  if (Array.isArray(userIds) && userIds.length) return userIds;

  // By role (or 'all')
  const filter = { isActive: true };
  if (targetRole && targetRole !== 'all') filter.role = targetRole;

  const users = await User.find(filter).select('_id').lean();
  return users.map(u => u._id);
};

/**
 * POST /api/alerts
 * Admin sends an alert.
 *
 * Body options (pick one targeting strategy):
 *   { userId, message, type }                  — single user
 *   { userIds: [...], message, type }           — explicit list
 *   { targetRole: 'patient'|'doctor'|'all', message, type } — by role
 */
const createAlert = async (req, res, next) => {
  try {
    const { userId, userIds, targetRole, message, type } = req.body;

    if (!userId && !userIds?.length && !targetRole) {
      return sendError(res, 400, 'Provide userId, userIds[], or targetRole to target recipients.');
    }

    const recipientIds = await _resolveRecipients({ userId, userIds, targetRole });

    if (!recipientIds.length) {
      return sendError(res, 404, 'No active users found for the given target.');
    }

    // Bulk-insert one Alert per recipient
    const docs = recipientIds.map(uid => ({
      userId:  uid,
      message,
      type,
      sentBy:  req.user._id,
    }));

    const created = await Alert.insertMany(docs, { ordered: false });

    // Emit socket events (best-effort)
    created.forEach(a => _emit(a.userId, a));

    return sendSuccess(res, 201, `Alert sent to ${created.length} user(s).`, {
      count: created.length,
      targetRole: targetRole || null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/alerts
 * Get alerts for the logged-in user.
 * ?status=unread|read  ?page=1  ?limit=20
 */
const getMyAlerts = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const filter = { userId: req.user._id };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [alerts, total, unreadCount] = await Promise.all([
      Alert.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Alert.countDocuments(filter),
      Alert.countDocuments({ userId: req.user._id, status: 'unread' }),
    ]);

    return sendSuccess(res, 200, 'Alerts fetched.', {
      alerts,
      unreadCount,
      pagination: {
        total,
        page:  Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/alerts/:id/read
 * Mark a single alert as read (owner only).
 */
const markAsRead = async (req, res, next) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) return sendError(res, 404, 'Alert not found.');

    if (alert.userId.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'Not authorized to update this alert.');
    }

    alert.status = 'read';
    await alert.save();

    return sendSuccess(res, 200, 'Alert marked as read.', { alert });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/alerts/read-all
 * Mark all unread alerts for the logged-in user as read.
 */
const markAllAsRead = async (req, res, next) => {
  try {
    const result = await Alert.updateMany(
      { userId: req.user._id, status: 'unread' },
      { status: 'read' }
    );
    return sendSuccess(res, 200, `${result.modifiedCount} alert(s) marked as read.`, {
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/alerts/admin/all
 * Admin: list all alerts sent (with pagination).
 */
const listAllAlerts = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [alerts, total] = await Promise.all([
      Alert.find()
        .populate('userId',  'name email role')
        .populate('sentBy',  'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Alert.countDocuments(),
    ]);

    return sendSuccess(res, 200, 'All alerts fetched.', {
      alerts,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/alerts/:id
 * Admin: hard-delete any alert by ID.
 */
const deleteAlert = async (req, res, next) => {
  try {
    const alert = await Alert.findByIdAndDelete(req.params.id);
    if (!alert) return sendError(res, 404, 'Alert not found.');
    return sendSuccess(res, 200, 'Alert deleted.', { deletedId: req.params.id });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/alerts/bulk
 * Admin: delete multiple alerts by IDs.
 * Body: { ids: ['id1', 'id2', ...] }
 */
const bulkDeleteAlerts = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || !ids.length) {
      return sendError(res, 400, 'Provide an array of alert IDs in "ids".');
    }
    const result = await Alert.deleteMany({ _id: { $in: ids } });
    return sendSuccess(res, 200, `${result.deletedCount} alert(s) deleted.`, {
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { testRoute, createAlert, getMyAlerts, markAsRead, markAllAsRead, listAllAlerts, deleteAlert, bulkDeleteAlerts };
