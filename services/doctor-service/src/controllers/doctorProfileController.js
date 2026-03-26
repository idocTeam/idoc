import Doctor from "../models/Doctor.js";

// Small helper to safely build regex search
const escapeRegex = (value = "") => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// Public-safe fields for patient-facing responses
const PUBLIC_DOCTOR_FIELDS =
  "fullName specialty qualifications hospital consultationFee bio experienceYears availability createdAt updatedAt";

// Internal fields for doctor/internal-service use
const INTERNAL_DOCTOR_FIELDS =
  "-pw";

  