import { body, validationResult } from 'express-validator';
import { AppError } from './errorMiddleware.js';

/**
 * Validates the symptom check request body
 */
export const validateSymptomCheck = [
  body('patientId')
    .if((value, { req }) => !req.headers.authorization)
    .notEmpty().withMessage('Patient ID is required when not authenticated')
    .isString().withMessage('Patient ID must be a string'),
  
  body('symptoms')
    .notEmpty().withMessage('Symptoms description is required')
    .isLength({ min: 10 }).withMessage('Symptoms description should be at least 10 characters long'),
  
  body('severity')
    .optional()
    .isIn(['low', 'medium', 'high']).withMessage('Severity must be low, medium, or high'),
  
  body('age')
    .optional()
    .isNumeric().withMessage('Age must be a number'),
  
  body('gender')
    .optional()
    .isIn(['Male', 'Female', 'Other']).withMessage('Gender must be Male, Female, or Other'),
  
  body('existingConditions')
    .optional()
    .isArray().withMessage('Existing conditions must be an array'),
  
  body('allergies')
    .optional()
    .isArray().withMessage('Allergies must be an array'),
  
  body('medications')
    .optional()
    .isArray().withMessage('Medications must be an array'),

  // Middleware to handle validation results
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => err.msg).join(', ');
      return next(new AppError(errorMessages, 400));
    }
    next();
  }
];
