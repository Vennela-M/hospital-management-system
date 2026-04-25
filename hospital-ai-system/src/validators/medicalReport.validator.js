const { body } = require('express-validator');

const addReportValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Report title is required')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),

  body('report')
    .optional()
    .isString().trim(),

  body('fileUrl')
    .optional()
    .isURL().withMessage('File URL must be a valid URL'),

  body('fileData')
    .optional()
    .isString().withMessage('File data must be a base64 string'),

  body('fileName')
    .optional()
    .isString().trim(),

  body('fileType')
    .optional()
    .isString().trim(),

  body('date')
    .optional()
    .isISO8601().withMessage('Date must be a valid ISO 8601 date'),

  body('patientId')
    .optional()
    .isMongoId().withMessage('Patient ID must be a valid MongoDB ObjectId'),
];

module.exports = { addReportValidator };
