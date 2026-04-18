import Doctor from "../models/Doctor.js";
import Prescription from "../models/Prescription.js";

// -----------------------------------------------------
// Service base URLs
// Keep these in .env
// Example:
// APPOINTMENT_SERVICE_URL=http://localhost:5003/api/appointments
// TELEMEDICINE_SERVICE_URL=http://localhost:5004/api/telemedicine
// PATIENT_SERVICE_URL=http://localhost:5005/api/patients
// -----------------------------------------------------
const APPOINTMENT_SERVICE_URL = process.env.APPOINTMENT_SERVICE_URL || "";
const TELEMEDICINE_SERVICE_URL = process.env.TELEMEDICINE_SERVICE_URL || "";
const PATIENT_SERVICE_URL = process.env.PATIENT_SERVICE_URL || "";

// -----------------------------------------------------
// Helpers
// -----------------------------------------------------

// Join base URL + path safely
const joinUrl = (base, path = "") => {
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
};

// Forward auth + doctor identity to downstream services
const getForwardHeaders = (req) => {
  const headers = {
    "Content-Type": "application/json",
    "x-doctor-id": String(req.user.id),
    "x-user-role": "doctor"
  };

  // Forward original bearer token if it exists
  if (req.headers.authorization) {
    headers.Authorization = req.headers.authorization;
  }

  return headers;
};

// Build URL with query params
const buildUrlWithQuery = (url, query = {}) => {
  const finalUrl = new URL(url);

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      finalUrl.searchParams.set(key, value);
    }
  });

  return finalUrl.toString();
};

// Read service response safely
const parseJsonResponse = async (response) => {
  const text = await response.text();

  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    const error = new Error(
      data.message || `Downstream service request failed with status ${response.status}.`
    );
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
};

// Generic downstream service caller
const callService = async ({
  req,
  baseUrl,
  path = "",
  method = "GET",
  query = {},
  body
}) => {
  if (!baseUrl) {
    const error = new Error("Required downstream service URL is not configured.");
    error.status = 500;
    throw error;
  }

  const url = buildUrlWithQuery(joinUrl(baseUrl, path), query);

  const response = await fetch(url, {
    method,
    headers: getForwardHeaders(req),
    body: body ? JSON.stringify(body) : undefined
  });

  return parseJsonResponse(response);
};

// Consistent error response
const handleIntegrationError = (res, fallbackMessage, error) => {
  return res.status(error.status || 502).json({
    message: fallbackMessage,
    error: error.message,
    details: error.details || null
  });
};

// Safe call for dashboard aggregation
const safeCall = async (fn) => {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error: {
        message: error.message,
        status: error.status || 502
      }
    };
  }
};

// Extract first array-like collection from response
const extractArray = (payload, preferredKeys = []) => {
  if (Array.isArray(payload)) return payload;

  for (const key of preferredKeys) {
    if (Array.isArray(payload?.[key])) {
      return payload[key];
    }
  }

  if (payload && typeof payload === "object") {
    for (const value of Object.values(payload)) {
      if (Array.isArray(value)) {
        return value;
      }
    }
  }

  return [];
};

// Extract count from response
const extractCount = (payload, preferredKeys = []) => {
  if (typeof payload?.total === "number") {
    return payload.total;
  }

  return extractArray(payload, preferredKeys).length;
};

// -----------------------------------------------------
// Appointment-service integrations
// -----------------------------------------------------

// Get doctor's pending appointment requests
export const getDoctorPendingAppointments = async (req, res) => {
  try {
    const data = await callService({
      req,
      baseUrl: APPOINTMENT_SERVICE_URL,
      path: `doctor/${req.user.id}/pending`,
      method: "GET",
      query: req.query
    });

    return res.status(200).json(data);
  } catch (error) {
    return handleIntegrationError(
      res,
      "Failed to fetch pending appointment requests.",
      error
    );
  }
};

// Get all doctor appointments
export const getDoctorAppointments = async (req, res) => {
  try {
    const data = await callService({
      req,
      baseUrl: APPOINTMENT_SERVICE_URL,
      path: `doctor/${req.user.id}`,
      method: "GET",
      query: req.query
    });

    return res.status(200).json(data);
  } catch (error) {
    return handleIntegrationError(
      res,
      "Failed to fetch doctor appointments.",
      error
    );
  }
};

// Accept appointment request
export const acceptDoctorAppointmentRequest = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const data = await callService({
      req,
      baseUrl: APPOINTMENT_SERVICE_URL,
      path: `${appointmentId}/accept`,
      method: "PATCH",
      body: {
        doctorId: req.user.id,
        ...req.body
      }
    });

    return res.status(200).json({
      message: "Appointment request accepted successfully.",
      result: data
    });
  } catch (error) {
    return handleIntegrationError(
      res,
      "Failed to accept appointment request.",
      error
    );
  }
};

// Reject appointment request
export const rejectDoctorAppointmentRequest = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const data = await callService({
      req,
      baseUrl: APPOINTMENT_SERVICE_URL,
      path: `${appointmentId}/reject`,
      method: "PATCH",
      body: {
        doctorId: req.user.id,
        ...req.body
      }
    });

    return res.status(200).json({
      message: "Appointment request rejected successfully.",
      result: data
    });
  } catch (error) {
    return handleIntegrationError(
      res,
      "Failed to reject appointment request.",
      error
    );
  }
};

// -----------------------------------------------------
// Telemedicine-service integrations
// -----------------------------------------------------

// Get doctor's telemedicine sessions
export const getDoctorTelemedicineSessions = async (req, res) => {
  try {
    const data = await callService({
      req,
      baseUrl: TELEMEDICINE_SERVICE_URL,
      path: `doctor/${req.user.id}`,
      method: "GET",
      query: req.query
    });

    return res.status(200).json(data);
  } catch (error) {
    return handleIntegrationError(
      res,
      "Failed to fetch doctor telemedicine sessions.",
      error
    );
  }
};

// Start telemedicine session
export const startDoctorTelemedicineSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const data = await callService({
      req,
      baseUrl: TELEMEDICINE_SERVICE_URL,
      path: `${sessionId}/start`,
      method: "PATCH",
      body: {
        doctorId: req.user.id,
        ...req.body
      }
    });

    return res.status(200).json({
      message: "Telemedicine session started successfully.",
      result: data
    });
  } catch (error) {
    return handleIntegrationError(
      res,
      "Failed to start telemedicine session.",
      error
    );
  }
};

// End telemedicine session
export const endDoctorTelemedicineSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const data = await callService({
      req,
      baseUrl: TELEMEDICINE_SERVICE_URL,
      path: `${sessionId}/end`,
      method: "PATCH",
      body: {
        doctorId: req.user.id,
        ...req.body
      }
    });

    return res.status(200).json({
      message: "Telemedicine session ended successfully.",
      result: data
    });
  } catch (error) {
    return handleIntegrationError(
      res,
      "Failed to end telemedicine session.",
      error
    );
  }
};

// -----------------------------------------------------
// Patient-service integrations
// -----------------------------------------------------

// Get uploaded reports for one patient
export const getPatientReportsForDoctor = async (req, res) => {
  try {
    const { patientId } = req.params;

    const data = await callService({
      req,
      baseUrl: PATIENT_SERVICE_URL,
      path: `${patientId}/reports`,
      method: "GET",
      query: req.query
    });

    return res.status(200).json(data);
  } catch (error) {
    return handleIntegrationError(
      res,
      "Failed to fetch patient uploaded reports.",
      error
    );
  }
};

// Get one patient report by report ID
export const getPatientReportById = async (req, res) => {
  try {
    const { reportId } = req.params;

    const data = await callService({
      req,
      baseUrl: PATIENT_SERVICE_URL,
      path: `reports/${reportId}`,
      method: "GET",
      query: req.query
    });

    return res.status(200).json(data);
  } catch (error) {
    return handleIntegrationError(
      res,
      "Failed to fetch patient report.",
      error
    );
  }
};

// -----------------------------------------------------
// Doctor dashboard summary
// This aggregates local data + downstream service data
// -----------------------------------------------------

export const getDoctorDashboardSummary = async (req, res) => {
  try {
    // Local doctor data
    const [doctor, activePrescriptionCount, totalPrescriptionCount] =
      await Promise.all([
        Doctor.findById(req.user.id).select(
          "fullName specialty hospital availability photoPath approvalStatus"
        ),
        Prescription.countDocuments({
          doctorId: req.user.id,
          status: "active"
        }),
        Prescription.countDocuments({
          doctorId: req.user.id
        })
      ]);

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found."
      });
    }

    // Remote service data (safe/partial aggregation)
    const [pendingAppointmentsRes, allAppointmentsRes, sessionsRes] =
      await Promise.all([
        safeCall(() =>
          callService({
            req,
            baseUrl: APPOINTMENT_SERVICE_URL,
            path: `doctor/${req.user.id}/pending`,
            method: "GET"
          })
        ),
        safeCall(() =>
          callService({
            req,
            baseUrl: APPOINTMENT_SERVICE_URL,
            path: `doctor/${req.user.id}`,
            method: "GET"
          })
        ),
        safeCall(() =>
          callService({
            req,
            baseUrl: TELEMEDICINE_SERVICE_URL,
            path: `doctor/${req.user.id}`,
            method: "GET"
          })
        )
      ]);

    const pendingAppointmentsCount = pendingAppointmentsRes.ok
      ? extractCount(pendingAppointmentsRes.data, ["appointments", "pendingAppointments"])
      : null;

    const totalAppointmentsCount = allAppointmentsRes.ok
      ? extractCount(allAppointmentsRes.data, ["appointments"])
      : null;

    const totalSessionsCount = sessionsRes.ok
      ? extractCount(sessionsRes.data, ["sessions"])
      : null;

    return res.status(200).json({
      summary: {
        doctor: {
          id: doctor._id,
          fullName: doctor.fullName,
          specialty: doctor.specialty,
          hospital: doctor.hospital,
          photoPath: doctor.photoPath,
          approvalStatus: doctor.approvalStatus
        },

        counts: {
          pendingAppointments: pendingAppointmentsCount,
          totalAppointments: totalAppointmentsCount,
          totalTelemedicineSessions: totalSessionsCount,
          activePrescriptions: activePrescriptionCount,
          totalPrescriptions: totalPrescriptionCount,
          availabilitySlots: Array.isArray(doctor.availability)
            ? doctor.availability.length
            : 0
        },

        integrations: {
          appointmentService: {
            pendingLoaded: pendingAppointmentsRes.ok,
            allLoaded: allAppointmentsRes.ok,
            pendingError: pendingAppointmentsRes.ok
              ? null
              : pendingAppointmentsRes.error,
            allError: allAppointmentsRes.ok
              ? null
              : allAppointmentsRes.error
          },
          telemedicineService: {
            loaded: sessionsRes.ok,
            error: sessionsRes.ok ? null : sessionsRes.error
          }
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to build doctor dashboard summary.",
      error: error.message
    });
  }
};