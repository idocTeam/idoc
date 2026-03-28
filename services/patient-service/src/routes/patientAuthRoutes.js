import express from "express";
import {
  registerPatient,
  loginPatient,
  getMyPatientProfile,
  updateMyPatientProfile,
  deleteMyPatientProfile
} from "../controllers/patientAuthController.js";
import { protectPatient } from "../middleware/authMiddleware.js";

const router = express.Router();

// Register patient
router.post("/register", registerPatient);

// Login patient
router.post("/login", loginPatient);

// Get logged-in patient profile
router.get("/me", protectPatient, getMyPatientProfile);

// Update logged-in patient profile
router.put("/me", protectPatient, updateMyPatientProfile);

// Delete logged-in patient profile
router.delete("/me", protectPatient, deleteMyPatientProfile);

export default router;