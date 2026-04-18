import SymptomCheck from '../models/SymptomCheck.js';
import { analyzeSymptoms } from '../services/openRouterService.js';
import { detectRedFlags, determineUrgency } from '../services/urgencyService.js';
import { asyncHandler, AppError } from '../middleware/errorMiddleware.js';
import { getPatientProfileFromService, calculateAge } from '../services/patientService.js';

/**
 * @desc    Submit symptoms for AI analysis
 * @route   POST /api/symptoms/check
 * @access  Public (Integrates with Patient Service if token provided)
 */
export const checkSymptoms = asyncHandler(async (req, res) => {
  const { 
    patientId, 
    symptoms, 
    duration, 
    severity, 
    age: manualAge, 
    gender: manualGender, 
    existingConditions, 
    allergies, 
    medications 
  } = req.body;

  // 1. Fetch patient profile from Patient Service if token is available
  let patientProfile = null;
  const token = req.token || (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') ? req.headers.authorization : null);
  
  if (token) {
    patientProfile = await getPatientProfileFromService(token);
  }

  // 2. Map data from Patient Service or fallback to manual input
  const age = patientProfile?.dateOfBirth ? calculateAge(patientProfile.dateOfBirth) : manualAge;
  const gender = patientProfile?.gender || manualGender;
  const finalPatientId = patientProfile?.userId || patientProfile?._id || patientId;

  if (!finalPatientId) {
    throw new AppError('Patient identification is required. Please provide patientId or a valid authentication token.', 400);
  }

  // 3. Detect red flags before AI analysis
  const redFlagsDetected = detectRedFlags(symptoms);

  // 4. Call OpenRouter for AI analysis
  console.log(`Starting AI analysis for symptoms: "${symptoms}"`);
  const aiResult = await analyzeSymptoms({
    symptoms,
    duration,
    severity,
    age,
    gender,
    existingConditions,
    allergies,
    medications
  });
  console.log('AI Analysis Result:', aiResult ? 'Success' : 'Failed (Fallback used)');

  // 5. Handle AI result or fallback
  let possibleConditions = [];
  let urgency = redFlagsDetected ? 'high' : 'medium';
  let recommendation = 'Monitor your symptoms and consult a licensed doctor for professional medical advice.';
  let recommendedDoctorSpecialties = ['General Physician'];
  let disclaimer = 'This is AI-generated guidance only and not a medical diagnosis.';

  if (aiResult) {
    possibleConditions = aiResult.possibleConditions || [];
    urgency = aiResult.urgency || urgency;
    recommendation = aiResult.recommendation || recommendation;
    recommendedDoctorSpecialties = aiResult.recommendedDoctorSpecialties || recommendedDoctorSpecialties;
  } else {
    // Better fallback logic when AI fails (e.g., 401 error)
    if (redFlagsDetected) {
      urgency = 'high';
      recommendation = 'URGENT: Based on your symptoms, please seek immediate medical attention at the nearest emergency room.';
      recommendedDoctorSpecialties = ['Emergency Medicine', 'General Physician'];
    } else if (symptoms.toLowerCase().includes('cough') || symptoms.toLowerCase().includes('fever')) {
      recommendation = 'You seem to have common cold or flu-like symptoms. Please rest, stay hydrated, and consult a doctor if symptoms persist.';
      recommendedDoctorSpecialties = ['General Physician', 'Pulmonologist'];
    } else {
      recommendation = 'Your symptoms require professional evaluation. Please schedule a consultation with a General Physician for a proper checkup.';
    }
    console.log('AI Failed - Using smart fallback recommendation');
  }

  // 6. Override urgency if red flags are detected
  urgency = determineUrgency(urgency, redFlagsDetected);

  // 7. If red flags detected, append emergency warning to recommendation
  if (redFlagsDetected) {
    recommendation = `URGENT: ${recommendation} Please seek immediate medical attention.`;
  }

  // 8. Save result to MongoDB
  const symptomCheck = await SymptomCheck.create({
    patientId: finalPatientId,
    symptoms,
    duration,
    severity,
    age,
    gender,
    existingConditions,
    allergies,
    medications,
    possibleConditions,
    recommendedDoctorSpecialties,
    urgency,
    recommendation,
    redFlagsDetected,
    disclaimer,
    rawAiResponse: aiResult
  });

  // 9. Send response
  res.status(201).json({
    success: true,
    message: 'Symptom analysis completed successfully.',
    data: symptomCheck
  });
});

/**
 * @desc    Get all symptom checks for a patient
 * @route   GET /api/symptoms/history/:patientId
 * @access  Public (Supports 'me' for authenticated users)
 */
export const getPatientHistory = asyncHandler(async (req, res) => {
  let { patientId } = req.params;

  // If patientId is 'me', try to get the ID from the token
  if (patientId === 'me') {
    const token = req.token || (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') ? req.headers.authorization : null);
    
    if (token) {
      const patientProfile = await getPatientProfileFromService(token);
      if (patientProfile) {
        patientId = patientProfile.userId || patientProfile._id;
      } else {
        throw new AppError('Could not fetch patient profile for history retrieval.', 401);
      }
    } else {
      throw new AppError('Authentication required to use "me" endpoint.', 401);
    }
  }

  const history = await SymptomCheck.find({ patientId }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    message: 'Patient history retrieved successfully.',
    count: history.length,
    data: history
  });
});

/**
 * @desc    Get single symptom check by ID
 * @route   GET /api/symptoms/:id
 * @access  Public (Future Auth-service integration pending)
 */
export const getSymptomCheckById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const symptomCheck = await SymptomCheck.findById(id);

  if (!symptomCheck) {
    throw new AppError('Symptom check record not found', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Symptom check record found.',
    data: symptomCheck
  });
});
