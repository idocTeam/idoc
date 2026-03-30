import mongoose from "mongoose";
import crypto from "crypto";

const patientReportSchema = new mongoose.Schema(
  {
    // Auto-generated business report ID
    reportId: {
      type: String,
      required: true,
      unique: true,
      default: () => `RPT-${crypto.randomUUID()}`
    },

    // Report category like Blood Test, X-Ray, MRI, Prescription, etc.
    reportType: {
      type: String,
      required: true,
      trim: true
    },

    // Store patient business ID (PAT-....), not Mongo _id
    patientId: {
      type: String,
      required: true,
      index: true,
      trim: true
    },

    // File metadata
    fileName: {
      type: String,
      required: true
    },

    filePath: {
      type: String,
      required: true
    },

    fileUrl: {
      type: String,
      required: true
    },

    mimeType: {
      type: String,
      required: true,
      default: "application/pdf"
    },

    fileSize: {
      type: Number,
      required: true
    }
  },
  { timestamps: true }
);

const PatientReport = mongoose.model("PatientReport", patientReportSchema);

export default PatientReport;