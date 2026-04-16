import axios from 'axios';
import { AppError } from '../middleware/errorMiddleware.js';

const PATIENT_SERVICE_URL = process.env.PATIENT_SERVICE_URL || 'http://localhost:5003/api/patients/auth';

/**
 * Fetch patient profile from Patient Service using a token
 * @param {string} token - Bearer token
 * @returns {Promise<Object|null>} - Patient profile data or null if unauthorized/not found
 */
export const getPatientProfileFromService = async (token) => {
  if (!token) return null;

  try {
    const response = await axios.get(`${PATIENT_SERVICE_URL}/me`, {
      headers: {
        Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`
      }
    });

    if (response.data && response.data.patient) {
      return response.data.patient;
    }
    return null;
  } catch (error) {
    console.error('Error fetching patient profile:', error.message);
    // If the error is 401 or 404, we just return null and fallback to request body data
    if (error.response && [401, 403, 404].includes(error.response.status)) {
      return null;
    }
    // For other errors (like service down), we can throw or return null based on requirements
    // Given the requirement for graceful fallback, we'll return null
    return null;
  }
};

/**
 * Helper to calculate age from date of birth
 * @param {Date|string} dob - Date of birth
 * @returns {number|null}
 */
export const calculateAge = (dob) => {
  if (!dob) return null;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};
