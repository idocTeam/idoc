import express from "express";
import {
  getDoctorPendingAppointments,
  getDoctorAppointments,
  acceptDoctorAppointmentRequest,
  rejectDoctorAppointmentRequest,
  getDoctorTelemedicineSessions,
  startDoctorTelemedicineSession,
  endDoctorTelemedicineSession,
  getPatientReportsForDoctor,
  getPatientReportById,
  getDoctorDashboardSummary
} from "../controllers/doctorIntegrationController.js";
import { protectDoctor } from "../middleware/authMiddleware.js";

const router = express.Router();

// All integration routes require doctor login
router.use(protectDoctor);

// Dashboard
router.get("/dashboard", getDoctorDashboardSummary);

// Appointment integrations
router.get("/appointments/pending", getDoctorPendingAppointments);
router.get("/appointments", getDoctorAppointments);
router.patch(
  "/appointments/:appointmentId/accept",
  acceptDoctorAppointmentRequest
);
router.patch(
  "/appointments/:appointmentId/reject",
  rejectDoctorAppointmentRequest
);

// Telemedicine integrations
router.get("/telemedicine/sessions", getDoctorTelemedicineSessions);
router.patch(
  "/telemedicine/sessions/:sessionId/start",
  startDoctorTelemedicineSession
);
router.patch(
  "/telemedicine/sessions/:sessionId/end",
  endDoctorTelemedicineSession
);

// Patient report integrations
router.get("/patients/:patientId/reports", getPatientReportsForDoctor);
router.get("/patients/reports/:reportId", getPatientReportById);

export default router;