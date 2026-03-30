import express from "express";
import {
  createReport,
  getMyReports,
  getMyReportById,
  updateMyReport,
  deleteMyReport,
  getReportsByPatientId,
  getReportByPatientIdAndReportId
} from "../controllers/reportController.js";
import {
  protectPatient,
  protectUser,
  allowRoles
} from "../middleware/authMiddleware.js";
import { uploadReportPdf } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Patient report CRUD
router.post(
  "/",
  protectPatient,
  uploadReportPdf.single("reportFile"),
  createReport
);

router.get("/my", protectPatient, getMyReports);

router.get("/my/:reportId", protectPatient, getMyReportById);

router.put(
  "/my/:reportId",
  protectPatient,
  uploadReportPdf.single("reportFile"),
  updateMyReport
);

router.delete("/my/:reportId", protectPatient, deleteMyReport);

// Doctor/Admin access by patient ID
router.get(
  "/doctor/patient/:patientId",
  protectUser,
  allowRoles("doctor", "admin"),
  getReportsByPatientId
);

router.get(
  "/doctor/patient/:patientId/:reportId",
  protectUser,
  allowRoles("doctor", "admin"),
  getReportByPatientIdAndReportId
);

export default router;