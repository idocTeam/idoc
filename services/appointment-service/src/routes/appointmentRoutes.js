// src/routes/appointmentRoutes.js

import express from "express";
import {
  create,
  getById,
  getMine,
  getDoctorMine,
  accept,
  reject,
  cancel,
  complete,
  reschedule,
  getBookableSlots,
  doctorReschedule,
  acceptDoctorRescheduleController,
  rejectDoctorRescheduleController,
  markPaid
} from "../controllers/appointmentController.js";

import {
  protectUser,
  protectPatient,
  protectDoctor
} from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * Public/shared booking slot lookup
 * Example:
 * GET /api/appointments/doctors/:doctorId/bookable-slots?date=2026-04-06&mode=physical
 */
router.get("/doctors/:doctorId/bookable-slots", getBookableSlots);

/**
 * Patient routes
 */
router.post("/create", protectPatient, create);
router.post("/", protectPatient, create);

router.get("/mine", protectPatient, getMine);

router.patch("/:id/cancel", protectPatient, cancel);
router.patch("/:id/reschedule", protectPatient, reschedule);

/**
 * Patient decision routes for doctor-proposed reschedule
 */
router.patch(
  "/:id/accept-doctor-reschedule",
  protectPatient,
  acceptDoctorRescheduleController
);

router.patch(
  "/:id/reject-doctor-reschedule",
  protectPatient,
  rejectDoctorRescheduleController
);

/**
 * Doctor routes
 */
router.get("/doctor/me", protectDoctor, getDoctorMine);

router.patch("/:id/accept", protectDoctor, accept);
router.patch("/:id/reject", protectDoctor, reject);
router.patch("/:id/complete", protectDoctor, complete);
router.patch("/:id/doctor-reschedule", protectDoctor, doctorReschedule);

/**
 * Shared authenticated route
 * Patient or doctor who owns the appointment can access it
 */
router.get("/:id", protectUser, getById);

/**
 * Internal route for payment success (can be secured via internal IP check or shared secret)
 */
router.patch("/:id/mark-paid", markPaid);

export default router;