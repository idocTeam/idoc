import express from "express";
import cors from "cors";
import morgan from "morgan";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();

/*
  Keep gateway lean.
  Do not parse JSON here before proxying.
*/

const allowedOrigins = (process.env.CORS_ORIGINS || "*")
  .split(",")
  .map((origin) => origin.trim());

app.use(
  cors({
    origin: (origin, callback) => {
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

app.use(morgan("dev"));

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

const buildProxy = (target, serviceName, basePath) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    xfwd: true,
    proxyTimeout: 60000,
    timeout: 60000,

    // Re-add stripped base path before forwarding
    pathRewrite: (path) => `${basePath}${path}`,

    onError: (err, _req, res) => {
      if (!res.headersSent) {
        res.status(502).json({
          message: `${serviceName} is unavailable through gateway`,
          error: err.message
        });
      }
    }
  });

app.use(
  "/api/admin",
  buildProxy(
    process.env.ADMIN_SERVICE_URL,
    "admin-service",
    "/api/admin"
  )
);

app.use(
  "/api/doctors",
  buildProxy(
    process.env.DOCTOR_SERVICE_URL,
    "doctor-service",
    "/api/doctors"
  )
);

app.use(
  "/api/patients",
  buildProxy(
    process.env.PATIENT_SERVICE_URL,
    "patient-service",
    "/api/patients"
  )
);

app.use(
  "/uploads",
  buildProxy(
    process.env.PATIENT_SERVICE_URL,
    "patient-service uploads",
    "/uploads"
  )
);

app.use((_req, res) => {
  res.status(404).json({
    message: "Gateway route not found"
  });
});

export default app;