import express from "express";
import {
  registerPatient,
  loginPatient,
  getMyPatientProfile
} from "../controllers/patientAuthController.js";
import { protectPatient } from "../middleware/authMiddleware.js";

const router = express.Router();

// Register patient
router.post("/register", registerPatient);

// Login patient
router.post("/login", loginPatient);

// Protected route to test JWT
router.get("/me", protectPatient, getMyPatientProfile);

export default router;