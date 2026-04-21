import mongoose from "mongoose";
import crypto from "crypto";

const patientSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    // Using pw to match your pattern
    pw: {
      type: String,
      required: true,
      select: false
    },

    userId: {
      type: String,
      required: true,
      unique: true,
      default: () => `PAT-${crypto.randomUUID()}`
    },

    fullName: {
      type: String,
      required: true,
      trim: true
    },

    phone: {
      type: String,
      required: true,
      trim: true
    },

    dateOfBirth: {
      type: Date,
      default: null
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      default: "Other"
    },

    address: {
      type: String,
      trim: true,
      default: ""
    },

    photoPath: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

const Patient = mongoose.model("Patient", patientSchema);

export default Patient;