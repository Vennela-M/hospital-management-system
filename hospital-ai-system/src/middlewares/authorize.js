const { sendError } = require('../utils/response');

/**
 * Restrict access to specific roles.
 * Usage: authorize('admin', 'doctor')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        403,
        `Role '${req.user.role}' is not authorized to access this resource.`
      );
    }
    next();
  };
};

module.exports = authorize;
