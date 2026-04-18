import express from "express";
import multer from "multer";
import fs from "fs";
import {
  registerDoctor,
  loginDoctor,
  getMyDoctorProfile
} from "../controllers/doctorAuthController.js";
import { protectDoctor } from "../middleware/authMiddleware.js";

const router = express.Router();

const ensureUploadDir = async (dir) => {
  await fs.promises.mkdir(dir, { recursive: true });
};

const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    try {
      const dir = "uploads/doctors";
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
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
  fileFilter: (_req, file, cb) => {
    const ok = ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype);
    cb(ok ? null : new Error("Only JPG, PNG, or WEBP images are allowed."), ok);
  }
});

// Register doctor
router.post("/register", upload.single("photo"), registerDoctor);

// Login doctor
router.post("/login", loginDoctor);

// Protected route to test JWT
router.get("/me", protectDoctor, getMyDoctorProfile);

export default router;