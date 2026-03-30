import mongoose from "mongoose";
import crypto from "crypto";

const doctorSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    pw: {
      type: String,
      required: true,
      select: false
    },

    userId: {
      type: String,
      required: true,
      unique: true,
      default: () => `DOC-${crypto.randomUUID()}`
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

    specialty: {
      type: String,
      required: true,
      trim: true
    },

    qualifications: {
      type: String,
      required: true,
      trim: true
    },

    hospital: {
      type: String,
      required: true,
      trim: true
    },

    consultationFee: {
      type: Number,
      required: true,
      min: 0
    },

    bio: {
      type: String,
      required: true,
      trim: true
    },

    experienceYears: {
      type: Number,
      required: true,
      min: 0
    },

    medicalLicenseNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },

    approvedAt: {
      type: Date,
      default: null
    },

    rejectionReason: {
      type: String,
      default: "",
      trim: true
    },

    isActive: {
      type: Boolean,
      default: true
    },

    deletedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

const Doctor = mongoose.model("Doctor", doctorSchema);

export default Doctor;