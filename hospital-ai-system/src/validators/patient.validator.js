const { body } = require('express-validator');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = ['male', 'female', 'other'];

const patientProfileValidator = [
  body('age')
    .optional()
    .isInt({ min: 0, max: 150 }).withMessage('Age must be a number between 0 and 150'),

  body('gender')
    .optional()
    .isIn(GENDERS).withMessage(`Gender must be one of: ${GENDERS.join(', ')}`),

  body('phone')
    .optional()
    .matches(/^\+?[\d\s\-().]{7,20}$/).withMessage('Please provide a valid phone number'),

  body('height')
    .optional()
    .isFloat({ min: 0 }).withMessage('Height must be a positive number (cm)'),

  body('weight')
    .optional()
    .isFloat({ min: 0 }).withMessage('Weight must be a positive number (kg)'),

  body('bloodGroup')
    .optional()
    .isIn(BLOOD_GROUPS).withMessage(`Blood group must be one of: ${BLOOD_GROUPS.join(', ')}`),

  body('allergies')
    .optional()
    .isArray().withMessage('Allergies must be an array of strings'),

  body('allergies.*')
    .optional()
    .isString().trim().notEmpty().withMessage('Each allergy must be a non-empty string'),

  body('chronicDiseases')
    .optional()
    .isArray().withMessage('Chronic diseases must be an array of strings'),

  body('chronicDiseases.*')
    .optional()
    .isString().trim().notEmpty().withMessage('Each chronic disease must be a non-empty string'),
];

module.exports = { patientProfileValidator };
