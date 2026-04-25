const { body } = require('express-validator');

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

const doctorProfileValidator = [
  body('name')
    .optional()
    .isString().withMessage('Name must be a string')
    .trim()
    .notEmpty().withMessage('Name cannot be empty'),

  body('specialization')
    .optional()
    .isString().withMessage('Specialization must be a string')
    .trim()
    .notEmpty().withMessage('Specialization cannot be empty'),

  body('experience')
    .optional()
    .isInt({ min: 0 }).withMessage('Experience must be a non-negative integer (years)'),

  body('availability')
    .optional()
    .isArray().withMessage('Availability must be an array of slots'),

  body('availability.*.day')
    .optional()
    .isIn(DAYS).withMessage(`Day must be one of: ${DAYS.join(', ')}`),

  body('availability.*.startTime')
    .optional()
    .matches(TIME_REGEX).withMessage('Start time must be in HH:MM format'),

  body('availability.*.endTime')
    .optional()
    .matches(TIME_REGEX).withMessage('End time must be in HH:MM format'),
];

module.exports = { doctorProfileValidator };
