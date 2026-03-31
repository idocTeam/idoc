import express from "express";
import cors from "cors";
import morgan from "morgan";
import patientAuthRoutes from "./routes/patientAuthRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Serve uploaded files
app.use("/uploads", express.static("uploads"));

// Health route
app.get("/", (req, res) => {
  res.json({
    service: "patient-service",
    status: "running"
  });
});

// Patient auth routes
app.use("/api/patients/auth", patientAuthRoutes);

// Patient report routes
app.use("/api/patients/reports", reportRoutes);

export default app;