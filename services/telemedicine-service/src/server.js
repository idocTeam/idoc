import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { createSession, rescheduleSession, cancelSession, getSessionByAppointment } from "./controllers/telemedicineController.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.post("/sessions/create", createSession);
app.post("/sessions/reschedule", rescheduleSession);
app.post("/sessions/cancel", cancelSession);
app.get("/sessions/appointment/:appointmentId", getSessionByAppointment);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "Telemedicine service is running" });
});

// Database connection
const PORT = process.env.PORT || 5006;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/idoc_telemedicine";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB (Telemedicine Service)");
    app.listen(PORT, () => {
      console.log(`Telemedicine Service running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database connection error:", err);
  });
