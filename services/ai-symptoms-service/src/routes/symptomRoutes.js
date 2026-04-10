import express from 'express';
import { 
  checkSymptoms, 
  getPatientHistory, 
  getSymptomCheckById 
} from '../controllers/symptomController.js';
import { validateSymptomCheck } from '../middleware/validationMiddleware.js';
import { authMiddlewarePlaceholder } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are currently public but have placeholder auth middleware for future integration
router.use(authMiddlewarePlaceholder);

/**
 * @route   POST /api/symptoms/check
 * @desc    Submit symptoms for AI analysis
 */
router.post('/check', validateSymptomCheck, checkSymptoms);

/**
 * @route   GET /api/symptoms/history/:patientId
 * @desc    Get all symptom checks for a patient
 */
router.get('/history/:patientId', getPatientHistory);

/**
 * @route   GET /api/symptoms/:id
 * @desc    Get single symptom check by ID
 */
router.get('/:id', getSymptomCheckById);

export default router;
