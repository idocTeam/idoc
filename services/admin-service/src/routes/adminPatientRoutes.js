import express from "express";
import { deletePatient } from "../controllers/adminPatientController.js";
import { protectAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Delete patient
router.delete("/:patientId", protectAdmin, deletePatient);

export default router;