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

      if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
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
      appointments: "/api/appointments",
      payments: "/api/payments",
      telemedicine: "/api/telemedicine",
      symptoms: "/api/symptoms",
      availability: "/api/availability",
      prescriptions: "/api/prescriptions",
      integrations: "/api/integrations",
      notifications: "/api/notifications",
      uploads: "/uploads"
    }
  });
});

// small helper to fail fast if env missing
const requireEnv = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const ADMIN_SERVICE_URL = requireEnv("ADMIN_SERVICE_URL");
const DOCTOR_SERVICE_URL = requireEnv("DOCTOR_SERVICE_URL");
const PATIENT_SERVICE_URL = requireEnv("PATIENT_SERVICE_URL");
const APPOINTMENT_SERVICE_URL = requireEnv("APPOINTMENT_SERVICE_URL");
const PAYMENT_SERVICE_URL = requireEnv("PAYMENT_SERVICE_URL");
const TELEMEDICINE_SERVICE_URL = requireEnv("TELEMEDICINE_SERVICE_URL");
const AI_SYMPTOMS_SERVICE_URL = requireEnv("AI_SYMPTOMS_SERVICE_URL");
const NOTIFICATION_SERVICE_URL = requireEnv("NOTIFICATION_SERVICE_URL");

// Admin routes
app.use(
  "/api/admin",
  createProxyMiddleware({
    target: ADMIN_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { "^/api/admin": "" },
    on: {
      error: (err, req, res) => {
        res.status(502).json({
          message: "admin-service unavailable",
          error: err.message
        });
      }
    }
  })
);

// Doctor routes
app.use(
  "/api/doctors",
  createProxyMiddleware({
    target: DOCTOR_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { "^/api/doctors": "" },
    on: {
      error: (err, req, res) => {
        res.status(502).json({
          message: "doctor-service unavailable",
          error: err.message
        });
      }
    }
  })
);

// Availability routes (part of doctor service)
app.use(
  "/api/availability",
  createProxyMiddleware({
    target: `${DOCTOR_SERVICE_URL}/availability`,
    changeOrigin: true,
    on: {
      error: (err, req, res) => {
        res.status(502).json({
          message: "availability service unavailable",
          error: err.message
        });
      }
    }
  })
);

// Prescription routes (part of doctor service)
app.use(
  "/api/prescriptions",
  createProxyMiddleware({
    target: `${DOCTOR_SERVICE_URL}/prescriptions`,
    changeOrigin: true,
    on: {
      error: (err, req, res) => {
        res.status(502).json({
          message: "prescription service unavailable",
          error: err.message
        });
      }
    }
  })
);

app.use(
  "/api/integrations",
  createProxyMiddleware({
    target: `${DOCTOR_SERVICE_URL}/integrations`,
    changeOrigin: true,
    on: {
      error: (err, req, res) => {
        res.status(502).json({
          message: "integration service unavailable",
          error: err.message
        });
      }
    }
  })
);

// Notification routes
app.use(
  "/api/notifications",
  createProxyMiddleware({
    target: NOTIFICATION_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { "^/api/notifications": "" },
    on: {
      error: (err, req, res) => {
        res.status(502).json({
          message: "notification-service unavailable",
          error: err.message
        });
      }
    }
  })
);

// Patient routes
app.use(
  "/api/patients",
  createProxyMiddleware({
    target: PATIENT_SERVICE_URL,
    changeOrigin: true,
    xfwd: true,
    pathRewrite: { "^/api/patients": "" },
    on: {
      error: (err, req, res) => {
        res.status(502).json({
          message: "patient-service unavailable",
          error: err.message
        });
      }
    }
  })
);


// Appointment routes
app.use(
  "/api/appointments",
  createProxyMiddleware({
    target: APPOINTMENT_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { "^/api/appointments": "" },
    on: {
      error: (err, req, res) => {
        res.status(502).json({
          message: "appointment-service unavailable",
          error: err.message
        });
      }
    }
  })
);

// Payment routes
app.use(
  "/api/payments",
  createProxyMiddleware({
    target: PAYMENT_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { "^/api/payments": "" },
    on: {
      error: (err, req, res) => {
        res.status(502).json({
          message: "payment-service unavailable",
          error: err.message
        });
      }
    }
  })
);

// Telemedicine routes
app.use(
  "/api/telemedicine",
  createProxyMiddleware({
    target: TELEMEDICINE_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { "^/api/telemedicine": "" },
    on: {
      error: (err, req, res) => {
        res.status(502).json({
          message: "telemedicine-service unavailable",
          error: err.message
        });
      }
    }
  })
);

// AI symptom checker routes
app.use(
  "/api/symptoms",
  createProxyMiddleware({
    // Note: Express strips the mount path (`/api/symptoms`) before the proxy sees it,
    // so a request to `/api/symptoms/check` becomes `/check` here.
    // We therefore proxy to `${AI_SYMPTOMS_SERVICE_URL}/api/symptoms` so the upstream
    // receives `/api/symptoms/check` as expected.
    target: `${AI_SYMPTOMS_SERVICE_URL}/api/symptoms`,
    changeOrigin: true,
    on: {
      error: (err, req, res) => {
        res.status(502).json({
          message: "ai-symptoms-service unavailable",
          error: err.message
        });
      }
    }
  })
);

// Uploaded files from patient-service
// Uploaded files from patient-service
app.use(
  "/uploads",
  createProxyMiddleware({
    target: `${PATIENT_SERVICE_URL}/uploads`,
    changeOrigin: true,
    xfwd: true,
    on: {
      error: (err, req, res) => {
        res.status(502).json({
          message: "patient-service uploads unavailable",
          error: err.message
        });
      }
    }
  })
);

// 404 fallback
app.use((_req, res) => {
  res.status(404).json({
    message: "Gateway route not found"
  });
});

export default app;