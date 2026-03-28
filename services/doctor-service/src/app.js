import express from "express";
import cors from "cors";
import morgan from "morgan";

import doctorAuthRoutes from "./routes/doctorAuthRoutes.js";
import doctorProfileRoutes from "./routes/doctorProfileRoutes.js";
import availabilityRoutes from "./routes/availabilityRoutes.js";
import prescriptionRoutes from "./routes/prescriptionRoutes.js";
import doctorIntegrationRoutes from "./routes/doctorIntegrationRoutes.js";

const app = express();

// Global middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Health route
app.get("/", (req, res) => {
  res.status(200).json({
    service: "doctor-service",
    status: "running",
    message: "Doctor service is up and running"
  });
});

// API routes
app.use("/api/doctors/auth", doctorAuthRoutes);
app.use("/api/doctors/profile", doctorProfileRoutes);
app.use("/api/doctors/availability", availabilityRoutes);
app.use("/api/doctors/prescriptions", prescriptionRoutes);
app.use("/api/doctors/integrations", doctorIntegrationRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found"
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global Error:", err);

  res.status(err.status || 500).json({
    message: err.message || "Internal server error"
  });
});

export default app;