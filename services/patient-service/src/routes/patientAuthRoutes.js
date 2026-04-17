import express from "express";
import multer from "multer";
import fs from "fs";
import {
  registerPatient,
  loginPatient,
  getMyPatientProfile,
  updateMyPatientProfile,
  deleteMyPatientProfile,
  getPatientById,
  deletePatientByAdmin,
  uploadMyPatientPhoto
} from "../controllers/patientAuthController.js";
import { protectPatient } from "../middleware/authMiddleware.js";

const router = express.Router();

const ensureUploadDir = async (dir) => {
  await fs.promises.mkdir(dir, { recursive: true });
};

const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    try {
      const dir = "uploads/patients";
      await ensureUploadDir(dir);
      cb(null, dir);
    } catch (e) {
      cb(e);
    }
  },
  filename: (_req, file, cb) => {
    const safe = String(file.originalname || "photo")
      .toLowerCase()
      .replace(/[^a-z0-9.\-_]/g, "-")
      .slice(-80);
    cb(null, `${Date.now()}-${Math.random().toString(16).slice(2)}-${safe}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype);
    cb(ok ? null : new Error("Only JPG, PNG, or WEBP images are allowed."), ok);
  }
});

// Register patient
router.post("/register", registerPatient);

// Login patient
router.post("/login", loginPatient);

// Get logged-in patient profile
router.get("/me", protectPatient, getMyPatientProfile);

// Update logged-in patient profile
router.put("/me", protectPatient, updateMyPatientProfile);
router.post("/me/photo", protectPatient, upload.single("photo"), uploadMyPatientPhoto);

// Delete logged-in patient profile
router.delete("/me", protectPatient, deleteMyPatientProfile);

// Get all patients (Internal/Admin)
router.get("/internal/all", (req, res, next) => {
  // Simple check for internal service secret or admin middleware
  if (req.headers["x-internal-service-key"] !== process.env.INTERNAL_SERVICE_SECRET) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
}, async (req, res) => {
  try {
    const Patient = (await import("../models/Patient.js")).default;
    const patients = await Patient.find({ deletedAt: null }).select("-pw");
    res.status(200).json({ patients });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get patient by ID (Internal/Admin)
router.get("/:id", getPatientById);

// NEW: delete patient account (Internal/Admin)
router.delete("/internal/admin/:id", deletePatientByAdmin);

export default router;