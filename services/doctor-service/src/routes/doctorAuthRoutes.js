import express from "express";
import {
  registerDoctor,
  loginDoctor,
  getMyDoctorProfile
} from "../controllers/doctorAuthController.js";
import { protectDoctor } from "../middleware/authMiddleware.js";

const router = express.Router();

// Register doctor
router.post("/register", registerDoctor);

// Login doctor
router.post("/login", loginDoctor);

// Protected route to test JWT
router.get("/me", protectDoctor, getMyDoctorProfile);

export default router;