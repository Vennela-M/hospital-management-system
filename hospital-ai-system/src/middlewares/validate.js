const { validationResult } = require('express-validator');
const { sendError } = require('../utils/response');

/**
 * Run express-validator checks and short-circuit with 422 if any fail.
 */
const validate = (validations) => {
  return async (req, res, next) => {
    for (const validation of validations) {
      await validation.run(req);
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 422, 'Validation failed', errors.array());
    }

    next();
  };
};

module.exports = validate;
