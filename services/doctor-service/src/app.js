import express from "express";
import cors from "cors";
import morgan from "morgan";
import doctorAuthRoutes from "./routes/doctorAuthRoutes.js";
import doctorProfileRoutes from "./routes/doctorProfileRoutes.js";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Health route
app.get("/", (req, res) => {
  res.json({
    service: "doctor-service",
    status: "running"
  });
});

// Doctor auth routes
app.use("/api/doctors/auth", doctorAuthRoutes);

export default app;