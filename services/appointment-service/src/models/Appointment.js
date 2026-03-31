// src/models/Appointment.js

import mongoose from "mongoose"; // ES module import (modern syntax)

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      required: true,
      index: true // ⚡ improves query performance for patient lookups
    },

    doctorId: {
      type: String,
      required: true,
      index: true // ⚡ improves doctor schedule queries
    },

    appointmentDate: {
      type: String, // keep simple (YYYY-MM-DD)
      required: true
    },

    startTime: {
      type: String, // "10:00"
      required: true
    },

    endTime: {
      type: String, // "10:30"
      required: true
    },

    reason: {
      type: String,
      default: ""
    },

    consultationType: {
      type: String,
      enum: ["telemedicine", "physical"],
      required: true
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "cancelled", "completed", "no_show"],
      default: "pending"
    },

    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid"
    },

    // Snapshot fields (avoid calling other services repeatedly)
    doctorName: String,
    patientName: String,
    doctorSpecialty: String
  },
  { timestamps: true }
);

export default mongoose.model("Appointment", appointmentSchema);