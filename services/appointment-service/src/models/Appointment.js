// src/models/Appointment.js

import mongoose from "mongoose";

/**
 * Reschedule sub-schema
 * Groups all reschedule-related data in one place.
 */
const rescheduleSchema = new mongoose.Schema(
  {
    requestedBy: {
      type: String,
      enum: ["patient", "doctor"]
    },

    reason: {
      type: String,
      trim: true
    },

    requestedAt: {
      type: Date
    },

    previousAppointmentDate: {
      type: String // YYYY-MM-DD
    },

    previousStartTime: {
      type: String // HH:MM
    },

    previousEndTime: {
      type: String // HH:MM
    },

    proposedDate: {
      type: String // YYYY-MM-DD
    },

    proposedStartTime: {
      type: String // HH:MM
    },

    proposedEndTime: {
      type: String // HH:MM
    },

    pendingPatientDecision: {
      type: Boolean,
      default: false
    },

    count: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { _id: false }
);

/**
 * Refund sub-schema
 * Groups all refund-related data in one place.
 */
const refundSchema = new mongoose.Schema(
  {
    requested: {
      type: Boolean,
      default: false
    },

    status: {
      type: String,
      enum: ["none", "pending", "approved", "rejected", "processed"],
      default: "none"
    },

    amount: {
      type: Number,
      default: 0,
      min: 0
    },

    serviceChargeDeducted: {
      type: Number,
      default: 0,
      min: 0
    },

    reason: {
      type: String,
      trim: true
    },

    policyApplied: {
      type: String,
      enum: [
        "none",
        "full_refund_patient_48h",
        "partial_refund_patient_24_48h",
        "no_refund_patient_under_24h",
        "full_refund_doctor_rescheduled"
      ],
      default: "none"
    },

    processedAt: {
      type: Date
    }
  },
  { _id: false }
);

/**
 * Main appointment schema
 */
const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      required: true,
      index: true
    },

    doctorId: {
      type: String,
      required: true,
      index: true
    },

    appointmentDate: {
      type: String, // YYYY-MM-DD
      required: true
    },

    startTime: {
      type: String, // HH:MM
      required: true
    },

    endTime: {
      type: String, // HH:MM
      required: true
    },

    reason: {
      type: String,
      default: "",
      trim: true
    },

    consultationType: {
      type: String,
      enum: ["online", "physical"],
      required: true
    },

    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "rejected",
        "cancelled",
        "completed",
        "no_show"
      ],
      default: "pending"
    },

    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid"
    },

    /**
     * Original amount paid for this appointment.
     * Refund calculations use this value.
     */
    amountPaid: {
      type: Number,
      default: 0,
      min: 0
    },

    cancelledBy: {
      type: String,
      enum: ["patient", "doctor"]
    },

    cancelledAt: {
      type: Date
    },

    doctorName: {
      type: String,
      default: "",
      trim: true
    },

    patientName: {
      type: String,
      default: "",
      trim: true
    },

    doctorSpecialty: {
      type: String,
      default: "",
      trim: true
    },

    reschedule: {
      type: rescheduleSchema,
      default: () => ({})
    },

    refund: {
      type: refundSchema,
      default: () => ({})
    }
  },
  { timestamps: true }
);

export default mongoose.model("Appointment", appointmentSchema);