import express from "express";
import {
  createPrescription,
  getMyIssuedPrescriptions,
  getPrescriptionById,
  getPrescriptionsByPatientId,
  updatePrescription,
  cancelPrescription
} from "../controllers/prescriptionController.js";
import { protectDoctor } from "../middleware/authMiddleware.js";

const router = express.Router();

// -------------------------------------
// All prescription routes require doctor login
// -------------------------------------
router.use(protectDoctor);

// Create a new prescription
router.post("/", createPrescription);

// Get all prescriptions issued by current doctor
router.get("/me", getMyIssuedPrescriptions);

// Get all prescriptions for one patient issued by current doctor
router.get("/patient/:patientId", getPrescriptionsByPatientId);

// Get one prescription by id
router.get("/:id", getPrescriptionById);

// Update one prescription by id
router.put("/:id", updatePrescription);

// Cancel one prescription by id
router.patch("/:id/cancel", cancelPrescription);

export default router;