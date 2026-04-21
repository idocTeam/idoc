import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { createCheckoutSession, handleWebhook, verifyPayment } from "./controllers/paymentController.js";
import { generateTicket, getTicket, downloadTicket } from "./controllers/eTicketController.js";


import { protectUser, requireAdmin } from "./middleware/authMiddleware.js";
import adminFinanceRoutes from "./routes/adminFinanceRoutes.js";
import axios from "axios";
import Payment from "./models/Payment.js";

dotenv.config();

const app = express();

app.use(cors());

app.post("/webhook", express.raw({ type: "application/json" }), handleWebhook);

app.use(express.json());

app.post("/create-checkout-session", protectUser, createCheckoutSession);
app.get("/verify-payment", verifyPayment);

app.post("/generate-ticket/:appointmentId", generateTicket);
app.get("/ticket/:appointmentId", protectUser, getTicket);
app.get("/ticket/:appointmentId/download", protectUser, downloadTicket);

app.use("/admin/finance", protectUser, requireAdmin, adminFinanceRoutes);

app.post("/simulate-success/:appointmentId", protectUser, requireAdmin, async (req, res) => {
  try {
    const { appointmentId } = req.params;

    let payment = await Payment.findOne({ appointmentId });

    if (!payment) {
      payment = new Payment({
        appointmentId,
        patientId: "SIMULATED_PATIENT",
        doctorId: "SIMULATED_DOCTOR",
        doctorName: "Simulated Doctor",
        amount: 50,
        currency: "usd",
        paymentMethod: "card",
        provider: "stripe",
        stripeSessionId: `sim_success_${Date.now()}`,
        status: "pending",
        isTest: true,
        metadata: {
          consultationType: "telemedicine",
          appointmentDate: "2026-04-15",
          startTime: "10:00"
        }
      });
    }

    payment.status = "completed";
    payment.paidAt = new Date();
    payment.failedAt = null;
    payment.failureReason = "";
    payment.isTest = true;

    await payment.save();

    await axios.patch(`${process.env.APPOINTMENT_SERVICE_URL}/${appointmentId}/mark-paid`, {
      amountPaid: 50
    });

    if (payment.metadata.consultationType === "telemedicine") {
      await axios.post(`${process.env.TELEMEDICINE_SERVICE_URL}/sessions/create`, {
        appointmentId,
        patientId: payment.patientId,
        doctorId: payment.doctorId,
        appointmentDate: payment.metadata.appointmentDate,
        startTime: payment.metadata.startTime
      });
    }

    await axios.post(`http://localhost:${PORT}/generate-ticket/${appointmentId}`);

    res.status(200).json({
      message: "Payment simulated successfully",
      appointmentId
    });
  } catch (err) {
    res.status(500).json({
      message: "Simulation failed",
      error: err.message
    });
  }
});

app.post("/simulate-failure/:appointmentId", protectUser, requireAdmin, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { reason = "Simulated payment failure" } = req.body || {};

    let payment = await Payment.findOne({ appointmentId });

    if (!payment) {
      payment = new Payment({
        appointmentId,
        patientId: "SIMULATED_PATIENT",
        doctorId: "SIMULATED_DOCTOR",
        doctorName: "Simulated Doctor",
        amount: 50,
        currency: "usd",
        paymentMethod: "card",
        provider: "stripe",
        stripeSessionId: `sim_fail_${Date.now()}`,
        status: "pending",
        isTest: true,
        metadata: {}
      });
    }

    payment.status = "failed";
    payment.failedAt = new Date();
    payment.failureReason = reason;
    payment.isTest = true;

    await payment.save();

    res.status(200).json({
      message: "Failed payment simulated successfully",
      appointmentId
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed payment simulation failed",
      error: err.message
    });
  }
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "Payment service is running" });
});

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