const User = require('../models/user.model');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * GET /api/users
 * Admin only — list all users.
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (role) filter.role = role;

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      User.find(filter).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
      User.countDocuments(filter),
    ]);

    return sendSuccess(res, 200, 'Users fetched.', {
      users,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/:id
 * Admin or the user themselves.
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return sendError(res, 404, 'User not found.');
    }

    // Non-admins can only view their own profile
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return sendError(res, 403, 'Not authorized to view this profile.');
    }

    return sendSuccess(res, 200, 'User fetched.', { user });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/users/:id/deactivate
 * Admin only — deactivate a user account.
 */
const deactivateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      return sendError(res, 404, 'User not found.');
    }

    return sendSuccess(res, 200, 'User deactivated.', { user });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllUsers, getUserById, deactivateUser };
