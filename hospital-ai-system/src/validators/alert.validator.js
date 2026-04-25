const { body } = require('express-validator');

const ALERT_TYPES = ['critical', 'reminder', 'outbreak', 'info', 'warning', 'emergency'];

const createAlertValidator = [
  body('message')
    .notEmpty().withMessage('Message is required')
    .isString().trim()
    .isLength({ max: 500 }).withMessage('Message cannot exceed 500 characters'),

  body('type')
    .notEmpty().withMessage('Type is required')
    .isIn(ALERT_TYPES).withMessage(`Type must be one of: ${ALERT_TYPES.join(', ')}`),

  // Target: one of userId, userIds[], targetRole, or 'all'
  body('userId')
    .optional()
    .isMongoId().withMessage('userId must be a valid MongoDB ObjectId'),

  body('userIds')
    .optional()
    .isArray().withMessage('userIds must be an array'),

  body('userIds.*')
    .optional()
    .isMongoId().withMessage('Each userId must be a valid MongoDB ObjectId'),

  body('targetRole')
    .optional()
    .isIn(['patient', 'doctor', 'admin', 'hospital', 'all'])
    .withMessage('targetRole must be patient, doctor, admin, hospital, or all'),
];

module.exports = { createAlertValidator };
