const { verifyToken } = require('../utils/jwt');
const User = require('../models/user.model');
const { sendError } = require('../utils/response');

/**
 * Verify the JWT from the Authorization header and attach the user to req.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 401, 'Access denied. No token provided.');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return sendError(res, 401, 'User belonging to this token no longer exists.');
    }

    if (!user.isActive) {
      return sendError(res, 403, 'Your account has been deactivated.');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 401, 'Token has expired. Please log in again.');
    }
    return sendError(res, 401, 'Invalid token.');
  }
};

module.exports = authenticate;
