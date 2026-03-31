import express from "express";
import cors from "cors";
import morgan from "morgan";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();

/*
  Important:
  This gateway is acting as a reverse proxy.
  So we do NOT parse request bodies here with express.json()
  before proxying, because that can interfere with POST/PUT/PATCH
  forwarding unless the body is re-streamed manually.
*/

// Read allowed CORS origins from env
const allowedOrigins = (process.env.CORS_ORIGINS || "*")
  .split(",")
  .map((origin) => origin.trim());

// CORS policy
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow Postman / curl / server-to-server calls
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.includes("*") ||
        allowedOrigins.includes(origin)
      ) {
        return callback(null, true);
      }

      return callback(new Error("CORS blocked by API Gateway"));
    }
  })
);

// Logging
app.use(morgan("dev"));

// Health route
app.get("/", (_req, res) => {
  res.status(200).json({
    service: "api-gateway",
    status: "running",
    routes: {
      admin: "/api/admin",
      doctors: "/api/doctors",
      patients: "/api/patients",
      uploads: "/uploads"
    }
  });
});

// Reusable proxy builder
const buildProxy = (target, serviceName) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    xfwd: true,
    proxyTimeout: 60000,
    timeout: 60000,
    onError: (err, _req, res) => {
      if (!res.headersSent) {
        res.status(502).json({
          message: `${serviceName} is unavailable through gateway`,
          error: err.message
        });
      }
    }
  });

// Admin routes
app.use(
  "/api/admin",
  buildProxy(process.env.ADMIN_SERVICE_URL, "admin-service")
);

// Doctor routes
app.use(
  "/api/doctors",
  buildProxy(process.env.DOCTOR_SERVICE_URL, "doctor-service")
);

// Patient routes
app.use(
  "/api/patients",
  buildProxy(process.env.PATIENT_SERVICE_URL, "patient-service")
);

// Uploaded files from patient-service
app.use(
  "/uploads",
  buildProxy(process.env.PATIENT_SERVICE_URL, "patient-service uploads")
);

// 404 fallback
app.use((_req, res) => {
  res.status(404).json({
    message: "Gateway route not found"
  });
});

export default app;