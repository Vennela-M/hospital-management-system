const { body } = require('express-validator');

const bookAppointmentValidator = [
  body('doctorId')
    .notEmpty().withMessage('Doctor ID is required')
    .isMongoId().withMessage('Doctor ID must be a valid MongoDB ObjectId'),

  body('date')
    .notEmpty().withMessage('Appointment date is required')
    .isISO8601().withMessage('Date must be a valid ISO 8601 date (e.g. 2025-06-15)'),

  body('time')
    .notEmpty().withMessage('Appointment time is required')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Time must be in HH:MM (24-hour) format'),

  body('notes')
    .optional()
    .isString().trim()
    .isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
];

module.exports = { bookAppointmentValidator };
