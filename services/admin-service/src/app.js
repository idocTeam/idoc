import express from "express";
import cors from "cors";
import morgan from "morgan";
import adminAuthRoutes from "./routes/adminAuthRoutes.js";
import adminDoctorRoutes from "./routes/adminDoctorRoutes.js";
import adminPatientRoutes from "./routes/adminPatientRoutes.js";

const app = express();

// Global middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Health route
app.get("/", (req, res) => {
  res.json({
    service: "admin-service",
    status: "running"
  });
});

// Routes
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin/doctors", adminDoctorRoutes);
app.use("/api/admin/patients", adminPatientRoutes);

export default app;