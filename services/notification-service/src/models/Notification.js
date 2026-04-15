// src/models/Notification.js

import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        "GENERIC",
        "APPOINTMENT_BOOKED",
        "APPOINTMENT_ACCEPTED",
        "APPOINTMENT_REJECTED",
        "APPOINTMENT_CANCELLED",
        "APPOINTMENT_REMINDER"
      ]
    },

    recipient: {
      userId: {
        type: String,
        trim: true
      },
      email: {
        type: String,
        trim: true,
        lowercase: true
      },
      phone: {
        type: String,
        trim: true
      },
      role: {
        type: String,
        trim: true
      }
    },

    channels: {
      type: [String],
      default: ["email"],
      enum: ["email", "sms", "in_app"]
    },

    subject: {
      type: String,
      trim: true
    },

    message: {
      type: String,
      trim: true
    },

    html: {
      type: String
    },

    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },

    status: {
      type: String,
      enum: ["pending", "sent", "failed"],
      default: "pending"
    },

    sentAt: {
      type: Date
    },

    errorMessage: {
      type: String
    }
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;