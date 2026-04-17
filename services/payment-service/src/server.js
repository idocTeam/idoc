import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { createCheckoutSession, handleWebhook, verifyPayment } from "./controllers/paymentController.js";
import { generateTicket, getTicket } from "./controllers/eTicketController.js";
import { protectUser } from "./middleware/authMiddleware.js";
import axios from "axios";
import Payment from "./models/Payment.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());

// Webhook needs raw body for signature verification
app.post("/webhook", express.raw({ type: "application/json" }), handleWebhook);

app.use(express.json());

// Routes
app.post("/create-checkout-session", protectUser, createCheckoutSession);
app.get("/verify-payment", verifyPayment);

// Note: generate-ticket is called by both webhook (internal) and patient-facing (optional)
// For simplicity, we allow it to be called without protectUser, but it would be better to secure it properly.
app.post("/generate-ticket/:appointmentId", generateTicket);
app.get("/ticket/:appointmentId", protectUser, getTicket);

// NEW: Simulate successful payment for testing without real Stripe
app.post("/simulate-success/:appointmentId", async (req, res) => {
  try {
    const { appointmentId } = req.params;
    
    // 1. Find or create payment record
    let payment = await Payment.findOne({ appointmentId });
    if (!payment) {
      payment = new Payment({
        appointmentId,
        patientId: "SIMULATED_PATIENT",
        amount: 50,
        status: "pending",
        metadata: {
          consultationType: "telemedicine",
          doctorId: "SIMULATED_DOCTOR",
          doctorName: "Simulated",
          appointmentDate: "2026-04-15",
          startTime: "10:00"
        }
      });
    }
    
    payment.status = "completed";
    await payment.save();

    // 2. Trigger same logic as webhook
    await axios.patch(`${process.env.APPOINTMENT_SERVICE_URL}/${appointmentId}/mark-paid`, {
      amountPaid: 50
    });

    if (payment.metadata.consultationType === "telemedicine") {
      await axios.post(`${process.env.TELEMEDICINE_SERVICE_URL}/sessions/create`, {
        appointmentId: appointmentId,
        patientId: payment.patientId,
        doctorId: payment.metadata.doctorId,
        appointmentDate: payment.metadata.appointmentDate,
        startTime: payment.metadata.startTime
      });
    }

    await axios.post(`http://localhost:${PORT}/generate-ticket/${appointmentId}`);

    res.status(200).json({ message: "Payment simulated successfully", appointmentId });
  } catch (err) {
    res.status(500).json({ message: "Simulation failed", error: err.message });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "Payment service is running" });
});

// Database connection
const PORT = process.env.PORT || 5005;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/idoc_payment";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB (Payment Service)");
    app.listen(PORT, () => {
      console.log(`Payment Service running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database connection error:", err);
  });
