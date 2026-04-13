// src/controllers/appointmentController.js

import {
  createAppointment,
  getAppointmentById,
  getPatientAppointments,
  getDoctorAppointments,
  acceptAppointment,
  rejectAppointment,
  cancelAppointment,
  completeAppointment,
  rescheduleAppointment,
  getBookableSlotsForDoctor,
  doctorRescheduleAppointment,
  acceptDoctorReschedule,
  rejectDoctorReschedule
} from "../services/appointmentService.js";

/**
 * POST /appointments
 * POST /appointments/create
 */
export const create = async (req, res) => {
  try {
    const appointment = await createAppointment(req.body, req.user);

    res.status(201).json({
      message: "Appointment created successfully",
      appointment
    });
  } catch (err) {
    res.status(400).json({
      message: err.message
    });
  }
};

/**
 * GET /appointments/:id
 */
export const getById = async (req, res) => {
  try {
    const appointment = await getAppointmentById(req.params.id, req.user);

    res.status(200).json({
      message: "Appointment fetched successfully",
      appointment
    });
  } catch (err) {
    res.status(400).json({
      message: err.message
    });
  }
};

/**
 * GET /appointments/mine
 * Patient appointments
 */
export const getMine = async (req, res) => {
  try {
    const appointments = await getPatientAppointments(req.user, req.query);

    res.status(200).json({
      message: "Patient appointments fetched successfully",
      appointments
    });
  } catch (err) {
    res.status(400).json({
      message: err.message
    });
  }
};

/**
 * GET /appointments/doctor/me
 * Doctor appointments
 */
export const getDoctorMine = async (req, res) => {
  try {
    const appointments = await getDoctorAppointments(req.user, req.query);

    res.status(200).json({
      message: "Doctor appointments fetched successfully",
      appointments
    });
  } catch (err) {
    res.status(400).json({
      message: err.message
    });
  }
};

/**
 * GET /appointments/doctors/:doctorId/bookable-slots?date=2026-04-06&mode=physical
 */
export const getBookableSlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date, mode = "" } = req.query;

    const result = await getBookableSlotsForDoctor({
      doctorId,
      date,
      mode
    });

    res.status(200).json({
      message: "Bookable slots fetched successfully",
      ...result
    });
  } catch (err) {
    res.status(400).json({
      message: err.message
    });
  }
};

/**
 * PATCH /appointments/:id/accept
 */
export const accept = async (req, res) => {
  try {
    const appointment = await acceptAppointment(req.params.id, req.user);

    res.status(200).json({
      message: "Appointment accepted successfully",
      appointment
    });
  } catch (err) {
    res.status(400).json({
      message: err.message
    });
  }
};

/**
 * PATCH /appointments/:id/reject
 */
export const reject = async (req, res) => {
  try {
    const appointment = await rejectAppointment(req.params.id, req.user);

    res.status(200).json({
      message: "Appointment rejected successfully",
      appointment
    });
  } catch (err) {
    res.status(400).json({
      message: err.message
    });
  }
};

/**
 * PATCH /appointments/:id/cancel
 */
export const cancel = async (req, res) => {
  try {
    const result = await cancelAppointment(req.params.id, req.body, req.user);

    res.status(200).json({
      message: "Appointment cancelled successfully",
      ...result
    });
  } catch (err) {
    res.status(400).json({
      message: err.message
    });
  }
};

/**
 * PATCH /appointments/:id/complete
 */
export const complete = async (req, res) => {
  try {
    const appointment = await completeAppointment(req.params.id, req.user);

    res.status(200).json({
      message: "Appointment completed successfully",
      appointment
    });
  } catch (err) {
    res.status(400).json({
      message: err.message
    });
  }
};

/**
 * PATCH /appointments/:id/reschedule
 * Patient reschedules own appointment
 */
export const reschedule = async (req, res) => {
  try {
    const appointment = await rescheduleAppointment(
      req.params.id,
      req.body,
      req.user
    );

    res.status(200).json({
      message: "Appointment rescheduled successfully",
      appointment
    });
  } catch (err) {
    res.status(400).json({
      message: err.message
    });
  }
};

/**
 * PATCH /appointments/:id/doctor-reschedule
 * Doctor proposes a new slot
 */
export const doctorReschedule = async (req, res) => {
  try {
    const appointment = await doctorRescheduleAppointment(
      req.params.id,
      req.body,
      req.user
    );

    res.status(200).json({
      message: "Doctor reschedule proposal created successfully",
      appointment
    });
  } catch (err) {
    res.status(400).json({
      message: err.message
    });
  }
};

/**
 * PATCH /appointments/:id/accept-doctor-reschedule
 * Patient accepts doctor's proposed new slot
 */
export const acceptDoctorRescheduleController = async (req, res) => {
  try {
    const appointment = await acceptDoctorReschedule(req.params.id, req.user);

    res.status(200).json({
      message: "Doctor reschedule accepted successfully",
      appointment
    });
  } catch (err) {
    res.status(400).json({
      message: err.message
    });
  }
};

/**
 * PATCH /appointments/:id/reject-doctor-reschedule
 * Patient rejects doctor's proposed new slot and refund flow begins
 */
export const rejectDoctorRescheduleController = async (req, res) => {
  try {
    const result = await rejectDoctorReschedule(
      req.params.id,
      req.body,
      req.user
    );

    res.status(200).json({
      message: "Doctor reschedule rejected successfully",
      ...result
    });
  } catch (err) {
    res.status(400).json({
      message: err.message
    });
  }
};