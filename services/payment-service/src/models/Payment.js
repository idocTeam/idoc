import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: String,
      required: true,
      index: true
    },
    patientId: {
      type: String,
      required: true,
      index: true
    },
    doctorId: {
      type: String,
      index: true
    },
    doctorName: {
      type: String,
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: "usd"
    },
    paymentMethod: {
      type: String,
      default: "card"
    },
    provider: {
      type: String,
      default: "stripe"
    },
    stripeSessionId: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
      index: true
    },
    paymentIntentId: {
      type: String
    },
    paidAt: {
      type: Date
    },
    failedAt: {
      type: Date
    },
    failureReason: {
      type: String
    },
    isTest: {
      type: Boolean,
      default: false
    },
    metadata: {
      type: Object,
      default: {}
    }
  },
  { timestamps: true }
);

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;