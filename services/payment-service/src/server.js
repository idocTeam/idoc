import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { createCheckoutSession, handleWebhook } from "./controllers/paymentController.js";
import { generateTicket, getTicket } from "./controllers/eTicketController.js";
import { protectUser } from "./middleware/authMiddleware.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());

// Webhook needs raw body for signature verification
app.post("/payments/webhook", express.raw({ type: "application/json" }), handleWebhook);

app.use(express.json());

// Routes
app.post("/payments/create-checkout-session", protectUser, createCheckoutSession);
app.post("/payments/generate-ticket/:appointmentId", protectUser, generateTicket);
app.get("/payments/ticket/:appointmentId", protectUser, getTicket);

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
