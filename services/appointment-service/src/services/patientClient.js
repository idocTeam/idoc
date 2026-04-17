// src/services/patientClient.js

import axios from "axios";

/**
 * Fetch patient info from patient-service
 */
export const getPatientById = async (patientId) => {
  const PATIENT_SERVICE_URL = process.env.PATIENT_SERVICE_URL;

  try {
    const url = `${PATIENT_SERVICE_URL}/auth/${patientId}`;

    console.log("PATIENT_SERVICE_URL =", PATIENT_SERVICE_URL);
    console.log("Calling patient-service:", url);

    const res = await axios.get(url);

    return res.data.patient;
  } catch (err) {
    console.error("patientClient error status:", err.response?.status);
    console.error("patientClient error data:", err.response?.data);
    console.error("patientClient error message:", err.message);

    return null;
  }
};
