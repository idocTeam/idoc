import TelemedicineSession from "../models/TelemedicineSession.js";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

const JITSI_BASE_URL = "https://meet.jit.si";

/**
 * POST /sessions/create
 * Create a Jitsi session for a paid appointment
 */
export const createSession = async (req, res) => {
  try {
    const { appointmentId, patientId, doctorId, appointmentDate, startTime } = req.body;

    // Check if session already exists
    const existingSession = await TelemedicineSession.findOne({ appointmentId });
    if (existingSession) {
      return res.status(200).json({
        message: "Session already exists",
        session: existingSession
      });
    }

    // Generate Jitsi Room ID
    const jitsiRoomId = `idoc-appointment-${appointmentId}-${uuidv4()}`;
    const jitsiLink = `${JITSI_BASE_URL}/${jitsiRoomId}`;

    // Create session record
    const session = new TelemedicineSession({
      appointmentId,
      patientId,
      doctorId,
      appointmentDate,
      startTime,
      jitsiRoomId,
      jitsiLink,
      status: "scheduled"
    });

    await session.save();

    // Trigger Notification/Email to patient and doctor (e-ticket generation)
    // We'll simulate e-ticket generation here by sending a response with the link
    res.status(201).json({
      message: "Telemedicine session created and scheduled",
      session
    });
  } catch (err) {
    console.error("Create Session Error:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * POST /sessions/reschedule
 */
export const rescheduleSession = async (req, res) => {
  try {
    const { appointmentId, newDate, newStartTime } = req.body;

    const session = await TelemedicineSession.findOneAndUpdate(
      { appointmentId },
      {
        appointmentDate: newDate,
        startTime: newStartTime,
        status: "scheduled"
      },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ message: "Telemedicine session not found" });
    }

    res.status(200).json({
      message: "Telemedicine session rescheduled successfully",
      session
    });
  } catch (err) {
    console.error("Reschedule Session Error:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * POST /sessions/cancel
 */
export const cancelSession = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    const session = await TelemedicineSession.findOneAndUpdate(
      { appointmentId },
      { status: "cancelled" },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ message: "Telemedicine session not found" });
    }

    res.status(200).json({
      message: "Telemedicine session cancelled successfully",
      session
    });
  } catch (err) {
    console.error("Cancel Session Error:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /sessions/appointment/:appointmentId
 * Get session details for an appointment
 */
export const getSessionByAppointment = async (req, res) => {
  try {
    const session = await TelemedicineSession.findOne({ appointmentId: req.params.appointmentId });

    if (!session) {
      return res.status(404).json({ message: "Session not found for this appointment" });
    }

    res.status(200).json({ session });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
