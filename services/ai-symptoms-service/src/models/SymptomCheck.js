import mongoose from 'mongoose';

const symptomCheckSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      required: [true, 'Patient ID is required'],
      index: true,
    },
    symptoms: {
      type: String,
      required: [true, 'Symptoms description is required'],
    },
    duration: {
      type: String,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    age: {
      type: Number,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
    },
    existingConditions: {
      type: [String],
      default: [],
    },
    allergies: {
      type: [String],
      default: [],
    },
    medications: {
      type: [String],
      default: [],
    },
    possibleConditions: {
      type: [String],
      default: [],
    },
    recommendedDoctorSpecialties: {
      type: [String],
      default: [],
    },
    urgency: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    recommendation: {
      type: String,
      required: [true, 'Recommendation is required'],
    },
    redFlagsDetected: {
      type: Boolean,
      default: false,
    },
    disclaimer: {
      type: String,
      required: true,
      default: 'This is AI-generated guidance only and not a medical diagnosis. Please consult a healthcare professional for a formal diagnosis.',
    },
    rawAiResponse: {
      type: Object,
    },
  },
  {
    timestamps: true,
  }
);

const SymptomCheck = mongoose.model('SymptomCheck', symptomCheckSchema);

export default SymptomCheck;
