import express from "express";
import multer from "multer";
import fs from "fs";
import {
  getMyDoctorProfile,
  updateMyDoctorProfile,
  uploadMyDoctorPhoto,
  deleteMyDoctorAccount,
  getDoctorById,
  getAllApprovedDoctors,
  searchApprovedDoctors,
  searchDoctorsBySpecialty,
  searchDoctorsByHospital,
  getDoctorPublicProfile,
  getPendingDoctorsForAdmin,
  getApprovedDoctorsForAdmin,
  approveDoctor,
  rejectDoctor,
  deleteDoctorByAdmin
} from "../controllers/doctorProfileController.js";

// Change this import to match your actual auth middleware file/function name
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

router.get("/me", protectDoctor, getMyDoctorProfile);
router.put("/me", protectDoctor, updateMyDoctorProfile);
router.post("/me/photo", protectDoctor, upload.single("photo"), uploadMyDoctorPhoto);
router.delete("/me", protectDoctor, deleteMyDoctorAccount);

router.get("/approved", getAllApprovedDoctors);
router.get("/search", searchApprovedDoctors);
router.get("/search/specialty", searchDoctorsBySpecialty);
router.get("/search/hospital", searchDoctorsByHospital);
router.get("/public/:id", getDoctorPublicProfile);

router.get("/admin/pending", getPendingDoctorsForAdmin);
router.get("/admin/approved", getApprovedDoctorsForAdmin);

router.get("/:id", getDoctorById);

// Admin-triggered doctor management routes
router.patch("/admin/:id/approve", approveDoctor);
router.patch("/admin/:id/reject", rejectDoctor);
router.delete("/admin/:id", deleteDoctorByAdmin);

export default router;