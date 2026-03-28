import express from "express";
import {
  getPendingDoctors,
  getApprovedDoctors,
  approveDoctor,
  rejectDoctor,
  deleteDoctor
} from "../controllers/adminDoctorController.js";
import { protectAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get pending doctors
router.get("/pending", protectAdmin, getPendingDoctors);

// Get approved doctors
router.get("/approved", protectAdmin, getApprovedDoctors);

// Approve doctor
router.patch("/:doctorId/approve", protectAdmin, approveDoctor);

// Reject doctor
router.patch("/:doctorId/reject", protectAdmin, rejectDoctor);

// Delete doctor
router.delete("/:doctorId", protectAdmin, deleteDoctor);

export default router;