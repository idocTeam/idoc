// src/controllers/appointmentController.js

import {
  createAppointment,
  acceptAppointment,
  cancelAppointment,
  getBookableSlotsForDoctor
} from "../services/appointmentService.js";

/**
 * POST /appointments
 */
export const create = async (req, res) => {
  try {
    const appointment = await createAppointment(req.body, req.user);
    res.status(201).json(appointment);
  } catch (err) {
    res.status(400).json({ message: err.message });
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

    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * PATCH /appointments/:id/accept
 */
export const accept = async (req, res) => {
  try {
    const appointment = await acceptAppointment(req.params.id, req.user);
    res.json(appointment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * PATCH /appointments/:id/cancel
 */
export const cancel = async (req, res) => {
  try {
    const appointment = await cancelAppointment(req.params.id, req.user);
    res.json(appointment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};