import ETicket from "../models/ETicket.js";
import Payment from "../models/Payment.js";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

/**
 * POST /payments/generate-ticket/:appointmentId
 */
export const generateTicket = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    // 1. Check if already exists
    const existingTicket = await ETicket.findOne({ appointmentId });
    if (existingTicket) {
      return res.status(200).json({ ticket: existingTicket });
    }

    // 2. Get payment info
    const payment = await Payment.findOne({ appointmentId, status: "completed" });
    if (!payment) {
      return res.status(400).json({ message: "No completed payment found for this appointment" });
    }

    // 3. Get session info for jitsi link
    let jitsiLink = "";
    try {
      const sessionResponse = await axios.get(`${process.env.TELEMEDICINE_SERVICE_URL}/sessions/appointment/${appointmentId}`);
      jitsiLink = sessionResponse.data.session.jitsiLink;
    } catch (err) {
      console.error("No telemedicine session found or service down");
    }

    // 4. Get patient and doctor names from some service (e.g. appointment or individual services)
    // For simplicity, we'll assume they're in the payment metadata or we fetch them
    const { doctorName, appointmentDate, startTime } = payment.metadata;
    
    // We'll need patient name too. Let's assume we get it from patient-service
    let patientName = "Patient";
    try {
        const patientResponse = await axios.get(`${process.env.PATIENT_SERVICE_URL}/patients/${payment.patientId}`);
        patientName = patientResponse.data.patient.name;
    } catch (err) {
        console.error("Failed to fetch patient name");
    }

    // 5. Create ETicket
    const ticketNumber = `TKT-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;
    const ticket = new ETicket({
      appointmentId,
      patientId: payment.patientId,
      doctorId: payment.metadata.doctorId,
      patientName,
      doctorName,
      appointmentDate,
      startTime,
      jitsiLink,
      amountPaid: payment.amount,
      ticketNumber
    });

    await ticket.save();

    res.status(201).json({
      message: "E-Ticket generated successfully",
      ticket
    });
  } catch (err) {
    console.error("Generate Ticket Error:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /payments/ticket/:appointmentId
 */
export const getTicket = async (req, res) => {
  try {
    const ticket = await ETicket.findOne({ appointmentId: req.params.appointmentId });
    if (!ticket) {
      return res.status(404).json({ message: "E-Ticket not found" });
    }
    res.status(200).json({ ticket });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
