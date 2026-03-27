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

/*
  SELF / PRIVATE DOCTOR ROUTES
  These require doctor login
*/
router.get("/me", protectDoctor, getMyDoctorProfile);
router.put("/me", protectDoctor, updateMyDoctorProfile);
router.delete("/me", protectDoctor, deleteMyDoctorAccount);

/*
  PUBLIC / DIRECTORY ROUTES
  These can be used by patient-service, appointment-service, frontend, etc.
*/
router.get("/approved", getAllApprovedDoctors);
router.get("/search", searchApprovedDoctors);
router.get("/search/specialty", searchDoctorsBySpecialty);
router.get("/search/hospital", searchDoctorsByHospital);
router.get("/public/:id", getDoctorPublicProfile);

/*
  INTERNAL / GENERAL DOCTOR LOOKUP
  Keep this after all specific routes
*/
router.get("/:id", getDoctorById);

// Admin-facing read-only doctor lists
router.get("/admin/pending", getPendingDoctorsForAdmin);
router.get("/admin/approved", getApprovedDoctorsForAdmin);

export default router;