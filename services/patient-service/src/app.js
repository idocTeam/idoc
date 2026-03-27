import express from "express";
import cors from "cors";
import morgan from "morgan";
import patientAuthRoutes from "./routes/patientAuthRoutes.js";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Health route
app.get("/", (req, res) => {
  res.json({
    service: "patient-service",
    status: "running"
  });
});

// Patient auth routes
app.use("/api/patients/auth", patientAuthRoutes);

export default app;