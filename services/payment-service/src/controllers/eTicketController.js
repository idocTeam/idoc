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
  let endTime = "";
  let doctorSpecialty = "";
  try {
      const appointmentResponse = await axios.get(`${process.env.APPOINTMENT_SERVICE_URL}/${appointmentId}`);
      const apt = appointmentResponse.data.appointment;
      reason = apt.reason || "";
      endTime = apt.endTime || startTime;
  } catch (err) {
      console.error("Failed to fetch appointment details from:", `${process.env.APPOINTMENT_SERVICE_URL}/${appointmentId}`);
  }

  // Get doctor specialty from doctor-service
  try {
      const doctorResponse = await axios.get(`${process.env.DOCTOR_SERVICE_URL}/profile/${payment.metadata.doctorId}`);
      doctorSpecialty = doctorResponse.data.doctor.specialty || "";
  } catch (err) {
      console.error("Failed to fetch doctor specialty from doctor-service");
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
    endTime,
    jitsiLink,
    amountPaid: payment.amount,
    ticketNumber,
    consultationType,
    reason,
    doctorSpecialty,
    transactionId: payment.stripeSessionId || `TXN-${Date.now()}`,
    bookingDate: payment.createdAt ? new Date(payment.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
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

    const doc = new PDFDocument({ size: "A4", margin: 0 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=IDOC_Ticket_${ticket.ticketNumber}.pdf`);

    doc.pipe(res);

    // === DECORATIVE BACKGROUND ===
    doc.rect(0, 0, 595.28, 842).fill("#f8fafc");

    // === HEADER BANNER ===
    const headerGradient = doc.linearGradient(0, 0, 595.28, 0);
    headerGradient.stop(0, "#0f172a");
    headerGradient.stop(1, "#1e3a5f");
    doc.rect(0, 0, 595.28, 140).fill(headerGradient);

    // Logo area
    doc.fillColor("#f87171").fontSize(10).font("Helvetica").text("HEALTHCARE PLATFORM", 50, 30);
    doc.fillColor("#ffffff").fontSize(28).font("Helvetica-Bold").text("IDOC E-TICKET", 50, 50);
    doc.fillColor("#94a3b8").fontSize(11).font("Helvetica").text("Your Trusted Healthcare Companion", 50, 82);

    // Ticket number box on right
    doc.rect(420, 25, 130, 90).fill("#ffffff10");
    doc.fillColor("#f87171").fontSize(9).font("Helvetica-Bold").text("TICKET NUMBER", 430, 35);
    doc.fillColor("#ffffff").fontSize(14).font("Courier-Bold").text(ticket.ticketNumber, 430, 52);

    // Status badge
    doc.rect(430, 78, 110, 28).fill("#22c55e");
    doc.fillColor("#ffffff").fontSize(10).font("Helvetica-Bold").text("CONFIRMED", 452, 84);

    // Divider line
    doc.moveTo(50, 140).lineTo(545, 140).lineWidth(3).strokeColor("#f87171").stroke();

    // === SECTION 1: PATIENT & BOOKING INFO ===
    let y = 165;

    doc.fillColor("#0f172a").fontSize(11).font("Helvetica-Bold").text("PATIENT & BOOKING INFORMATION", 50, y);
    y += 18;

    // Card background
    doc.rect(50, y, 495, 80).fill("#ffffff").stroke("#e2e8f0").lineWidth(1);
    y += 12;

    // Patient row
    doc.fillColor("#64748b").fontSize(10).font("Helvetica").text("Patient Name", 70, y);
    doc.fillColor("#0f172a").fontSize(12).font("Helvetica-Bold").text(ticket.patientName, 70, y + 14);

    doc.fillColor("#64748b").fontSize(10).font("Helvetica").text("Booking Date", 300, y);
    doc.fillColor("#0f172a").fontSize(12).font("Helvetica-Bold").text(ticket.bookingDate || new Date().toLocaleDateString(), 300, y + 14);

    y += 38;

    // Appointment ID row
    doc.fillColor("#64748b").fontSize(10).font("Helvetica").text("Appointment ID", 70, y);
    doc.fillColor("#0f172a").fontSize(12).font("Helvetica-Bold").text(ticket.appointmentId, 70, y + 14);

    y += 65;

    // === SECTION 2: DOCTOR & APPOINTMENT DETAILS ===
    doc.fillColor("#0f172a").fontSize(11).font("Helvetica-Bold").text("DOCTOR & APPOINTMENT DETAILS", 50, y);
    y += 18;

    doc.rect(50, y, 495, 110).fill("#ffffff").stroke("#e2e8f0").lineWidth(1);
    y += 12;

    // Doctor name and specialty
    doc.fillColor("#64748b").fontSize(10).font("Helvetica").text("Doctor", 70, y);
    doc.fillColor("#0f172a").fontSize(12).font("Helvetica-Bold").text(`Dr. ${ticket.doctorName}`, 70, y + 14);

    doc.fillColor("#64748b").fontSize(10).font("Helvetica").text("Specialty", 300, y);
    doc.fillColor("#0f172a").fontSize(12).font("Helvetica-Bold").text(ticket.doctorSpecialty || "General Practice", 300, y + 14);

    y += 38;

    // Date and time
    doc.fillColor("#64748b").fontSize(10).font("Helvetica").text("Appointment Date", 70, y);
    doc.fillColor("#0f172a").fontSize(12).font("Helvetica-Bold").text(ticket.appointmentDate, 70, y + 14);

    doc.fillColor("#64748b").fontSize(10).font("Helvetica").text("Time Slot", 300, y);
    doc.fillColor("#0f172a").fontSize(12).font("Helvetica-Bold").text(`${ticket.startTime} - ${ticket.endTime || ticket.startTime}`, 300, y + 14);

    y += 38;

    // Mode and reason
    doc.fillColor("#64748b").fontSize(10).font("Helvetica").text("Consultation Mode", 70, y);
    const modeText = ticket.consultationType === "online" ? "Telemedicine (Video Call)" : "Physical Visit";
    doc.fillColor("#0f172a").fontSize(12).font("Helvetica-Bold").text(modeText, 70, y + 14);

    if (ticket.reason) {
      doc.fillColor("#64748b").fontSize(10).font("Helvetica").text("Reason for Visit", 300, y);
      doc.fillColor("#0f172a").fontSize(11).font("Helvetica").text(ticket.reason.substring(0, 30) + (ticket.reason.length > 30 ? "..." : ""), 300, y + 14);
    }

    y += 60;

    // === SECTION 3: PAYMENT DETAILS (Receipt Style) ===
    doc.fillColor("#0f172a").fontSize(11).font("Helvetica-Bold").text("PAYMENT DETAILS", 50, y);
    y += 18;

    // Receipt card with accent
    doc.rect(50, y, 495, 90).fill("#ffffff").stroke("#e2e8f0").lineWidth(1);
    doc.rect(50, y, 8, 90).fill("#f87171");

    y += 12;

    // Payment rows
    doc.fillColor("#64748b").fontSize(10).font("Helvetica").text("Consultation Fee", 80, y);
    doc.fillColor("#0f172a").fontSize(12).font("Helvetica-Bold").text(`$${ticket.amountPaid}.00`, 420, y, { align: "right", width: 80 });

    y += 20;
    doc.fillColor("#e2e8f0").rect(70, y, 455, 1).fill();

    y += 12;
    doc.fillColor("#64748b").fontSize(10).font("Helvetica").text("Platform Fee", 80, y);
    doc.fillColor("#0f172a").fontSize(12).font("Helvetica-Bold").text("$0.00", 420, y, { align: "right", width: 80 });

    y += 20;
    doc.fillColor("#e2e8f0").rect(70, y, 455, 1).fill();

    y += 12;
    doc.fillColor("#64748b").fontSize(10).font("Helvetica").text("Total Amount", 80, y);
    doc.fillColor("#0f172a").fontSize(16).font("Helvetica-Bold").text(`$${ticket.amountPaid}.00`, 420, y, { align: "right", width: 80 });

    y += 15;
    doc.fillColor("#22c55e").fontSize(9).font("Helvetica-Bold").text("PAID", 420, y, { align: "right", width: 80 });

    y += 40;

    // === JITS LINK (if telemedicine) ===
    if (ticket.jitsiLink) {
      doc.rect(50, y, 495, 45).fill("#f0fdf4").stroke("#bbf7d0").lineWidth(1);
      doc.fillColor("#22c55e").fontSize(10).font("Helvetica-Bold").text("VIDEO CONSULTATION LINK", 70, y + 8);
      doc.fillColor("#166534").fontSize(11).font("Helvetica").text(ticket.jitsiLink, 70, y + 25, { width: 455 });
      y += 55;
    }

    // === FOOTER ===
    doc.rect(0, 750, 595.28, 92).fill("#0f172a");

    doc.fillColor("#f87171").fontSize(9).font("Helvetica-Bold").text("IMPORTANT INFORMATION", 50, 765);
    doc.fillColor("#94a3b8").fontSize(8).font("Helvetica").text("• Please arrive 15 minutes before your scheduled appointment time.", 50, 782);
    doc.fillColor("#94a3b8").fontSize(8).font("Helvetica").text("• Show this e-ticket as proof of your booking and payment.", 50, 796);
    doc.fillColor("#94a3b8").fontSize(8).font("Helvetica").text("• For telemedicine, click the video link above to join your session.", 50, 810);

    doc.fillColor("#64748b").fontSize(8).font("Helvetica").text("Generated by IDOC Healthcare Platform", 380, 825);
    doc.fillColor("#475569").fontSize(8).font("Helvetica").text(new Date().toLocaleString(), 380, 810);

    doc.end();
  } catch (err) {
    console.error("Download Ticket Error:", err);
    res.status(500).json({ message: err.message });
  }
};
