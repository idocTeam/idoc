import express from "express";
import {
  getMyDoctorProfile,
  updateMyDoctorProfile,
  deleteMyDoctorAccount,
  getDoctorById,
  getAllApprovedDoctors,
  searchApprovedDoctors,
  searchDoctorsBySpecialty,
  searchDoctorsByHospital,
  getDoctorPublicProfile,
  getPendingDoctorsForAdmin,
  getApprovedDoctorsForAdmin
} from "../controllers/doctorProfileController.js";

// Change this import to match your actual auth middleware file/function name
import { protectDoctor } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/me", protectDoctor, getMyDoctorProfile);
router.put("/me", protectDoctor, updateMyDoctorProfile);
router.delete("/me", protectDoctor, deleteMyDoctorAccount);

router.get("/approved", getAllApprovedDoctors);
router.get("/search", searchApprovedDoctors);
router.get("/search/specialty", searchDoctorsBySpecialty);
router.get("/search/hospital", searchDoctorsByHospital);
router.get("/public/:id", getDoctorPublicProfile);

router.get("/admin/pending", getPendingDoctorsForAdmin);
router.get("/admin/approved", getApprovedDoctorsForAdmin);

router.get("/:id", getDoctorById);

export default router;