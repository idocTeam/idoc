import express from "express";
import {
  approveDoctor,
  rejectDoctor,
  deleteDoctor
} from "../controllers/adminDoctorController.js";
import { protectAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Approve doctor
router.patch("/:doctorId/approve", protectAdmin, approveDoctor);

// Reject doctor
router.patch("/:doctorId/reject", protectAdmin, rejectDoctor);

// Delete doctor
router.delete("/:doctorId", protectAdmin, deleteDoctor);

export default router;