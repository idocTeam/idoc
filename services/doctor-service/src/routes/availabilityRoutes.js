import express from "express";
import {
  getMyAvailability,
  upsertMyAvailability,
  addAvailabilitySlot,
  updateAvailabilitySlot,
  removeAvailabilitySlot,
  toggleAvailabilityStatus,
  getDoctorAvailabilityById,
  filterDoctorsByAvailability
} from "../controllers/availabilityController.js";
import { protectDoctor } from "../middleware/authMiddleware.js";

const router = express.Router();

/*
  DOCTOR SELF AVAILABILITY ROUTES
*/
router.get("/me", protectDoctor, getMyAvailability);
router.put("/me", protectDoctor, upsertMyAvailability);
router.post("/me/slot", protectDoctor, addAvailabilitySlot);

// NEW: update one slot by index
router.patch("/me/slot/:index", protectDoctor, updateAvailabilitySlot);

router.delete("/me/slot/:index", protectDoctor, removeAvailabilitySlot);
router.patch("/me/slot/:index/toggle", protectDoctor, toggleAvailabilityStatus);

/*
  PUBLIC / INTERNAL AVAILABILITY ROUTES
*/
router.get("/filter", filterDoctorsByAvailability);
router.get("/:id", getDoctorAvailabilityById);

export default router;