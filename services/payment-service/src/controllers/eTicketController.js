import ETicket from "../models/ETicket.js";
import Payment from "../models/Payment.js";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import PDFDocument from "pdfkit";

/**
 * Internal helper to generate ticket data
 */
const createTicketInternal = async (appointmentId) => {
  // 1. Check if already exists
  const existingTicket = await ETicket.findOne({ appointmentId });
  if (existingTicket) {
    return existingTicket;
  }

  // 2. Get payment info
  const payment = await Payment.findOne({ appointmentId, status: "completed" });
  if (!payment) {
    throw new Error("No completed payment found for this appointment");
  }

  // 3. Get session info for jitsi link
  let jitsiLink = "";
  try {
    const sessionResponse = await axios.get(`${process.env.TELEMEDICINE_SERVICE_URL}/sessions/appointment/${appointmentId}`);
    jitsiLink = sessionResponse.data.session.jitsiLink;
  } catch (err) {
    console.error("No telemedicine session found or service down");
  }

  // 4. Get patient and doctor names from payment metadata
  const { doctorName, appointmentDate, startTime, consultationType } = payment.metadata;
  
  // Get extra info from appointment-service
  let reason = "";
  try {
      const appointmentResponse = await axios.get(`${process.env.APPOINTMENT_SERVICE_URL}/${appointmentId}`);
      reason = appointmentResponse.data.appointment.reason;
  } catch (err) {
      console.error("Failed to fetch appointment details from:", `${process.env.APPOINTMENT_SERVICE_URL}/${appointmentId}`);
  }

  // We'll need patient name too. Let's assume we get it from patient-service
  let patientName = "Patient";
  try {
      const patientResponse = await axios.get(`${process.env.PATIENT_SERVICE_URL}/auth/${payment.patientId}`);
      patientName = patientResponse.data.patient.fullName;
  } catch (err) {
      console.error("Failed to fetch patient name from:", `${process.env.PATIENT_SERVICE_URL}/auth/${payment.patientId}`);
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
    ticketNumber,
    consultationType,
    reason
  });

  await ticket.save();
  return ticket;
};

/**
 * POST /payments/generate-ticket/:appointmentId
 */
export const generateTicket = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const ticket = await createTicketInternal(appointmentId);
    
    res.status(201).json({
      message: "E-Ticket generated successfully",
      ticket
    });
  } catch (err) {
    console.error("Generate Ticket Error:", err);
    res.status(err.message.includes("No completed payment") ? 400 : 500).json({ message: err.message });
  }
};

/**
 * GET /payments/ticket/:appointmentId
 */
export const getTicket = async (req, res) => {
  try {
    let ticket = await ETicket.findOne({ appointmentId: req.params.appointmentId });
    
    if (!ticket) {
      // Try to generate it on the fly if payment exists
      try {
        ticket = await createTicketInternal(req.params.appointmentId);
      } catch (err) {
        return res.status(404).json({ message: "E-Ticket not found. Please ensure payment is completed." });
      }
    }
    
    res.status(200).json({ ticket });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /payments/ticket/:appointmentId/download
 */
export const downloadTicket = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    let ticket = await ETicket.findOne({ appointmentId });

    if (!ticket) {
      try {
        ticket = await createTicketInternal(appointmentId);
      } catch (err) {
        return res.status(404).json({ message: "E-Ticket not found for download." });
      }
    }

    const doc = new PDFDocument({ size: "A4", margin: 50 });

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=IDOC_Ticket_${ticket.ticketNumber}.pdf`);

    doc.pipe(res);

    // Design the PDF
    // Header
    doc.rect(0, 0, 595.28, 150).fill("#1e293b"); // Slate 900
    doc.fillColor("#ffffff").fontSize(24).font("Helvetica-Bold").text("IDOC E-TICKET", 50, 50);
    doc.fontSize(10).font("Helvetica").text("Your Digital Health Pass", 50, 80);

    doc.fillColor("#38bdf8").fontSize(10).font("Helvetica-Bold").text("TICKET NUMBER", 400, 50);
    doc.fillColor("#ffffff").fontSize(16).font("Courier-Bold").text(ticket.ticketNumber, 400, 65);

    // Status Badge
    doc.rect(400, 100, 140, 30).fill("#22c55e"); // Green 500
    doc.fillColor("#ffffff").fontSize(10).font("Helvetica-Bold").text("CONFIRMED & PAID", 415, 110);

    // Content
    let y = 200;

    // Patient Details
    doc.fillColor("#94a3b8").fontSize(10).font("Helvetica-Bold").text("PATIENT DETAILS", 50, y);
    doc.rect(50, y + 15, 500, 1).fill("#f1f5f9");
    y += 40;

    doc.fillColor("#64748b").fontSize(10).font("Helvetica").text("Full Name", 50, y);
    doc.fillColor("#0f172a").fontSize(14).font("Helvetica-Bold").text(ticket.patientName, 50, y + 15);

    doc.fillColor("#64748b").fontSize(10).font("Helvetica").text("Appointment ID", 300, y);
    doc.fillColor("#0f172a").fontSize(14).font("Helvetica-Bold").text(ticket.appointmentId, 300, y + 15);

    y += 70;

    // Consultation Details
    doc.fillColor("#94a3b8").fontSize(10).font("Helvetica-Bold").text("CONSULTATION DETAILS", 50, y);
    doc.rect(50, y + 15, 500, 1).fill("#f1f5f9");
    y += 40;

    doc.fillColor("#64748b").fontSize(10).font("Helvetica").text("Specialist", 50, y);
    doc.fillColor("#0f172a").fontSize(14).font("Helvetica-Bold").text(`Dr. ${ticket.doctorName}`, 50, y + 15);

    doc.fillColor("#64748b").fontSize(10).font("Helvetica").text("Date & Time", 300, y);
    doc.fillColor("#0f172a").fontSize(14).font("Helvetica-Bold").text(`${ticket.appointmentDate} at ${ticket.startTime}`, 300, y + 15);

    y += 70;

    doc.fillColor("#64748b").fontSize(10).font("Helvetica").text("Consultation Mode", 50, y);
    doc.fillColor("#0f172a").fontSize(14).font("Helvetica-Bold").text(ticket.consultationType === "online" ? "Telemedicine" : "Physical Visit", 50, y + 15);

    if (ticket.reason) {
        doc.fillColor("#64748b").fontSize(10).font("Helvetica").text("Reason for visit", 300, y);
        doc.fillColor("#0f172a").fontSize(12).font("Helvetica").text(ticket.reason, 300, y + 15, { width: 250 });
    }

    y += 80;

    // Payment Info
    doc.rect(50, y, 500, 80).fill("#f8fafc");
    doc.fillColor("#64748b").fontSize(10).font("Helvetica-Bold").text("TOTAL AMOUNT PAID", 70, y + 25);
    doc.fillColor("#0f172a").fontSize(28).font("Helvetica-Bold").text(`$${ticket.amountPaid}.00`, 70, y + 40);
    
    doc.fillColor("#64748b").fontSize(10).font("Helvetica").text("Currency: USD", 400, y + 45);

    y += 120;

    // Footer Info
    doc.fillColor("#94a3b8").fontSize(8).font("Helvetica").text("This e-ticket is digitally signed and serves as your proof of payment and booking. Please keep it ready during your consultation. Thank you for choosing IDOC for your healthcare needs.", 50, y, { width: 500, align: "center" });

    doc.end();
  } catch (err) {
    console.error("Download Ticket Error:", err);
    res.status(500).json({ message: err.message });
  }
};
