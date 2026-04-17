// src/services/appointmentService.js

import Appointment from "../models/Appointment.js";
import { getDoctorById } from "./doctorClient.js";
import { getPatientById } from "./patientClient.js";
import { sendNotification } from "./notificationClient.js";
import {
  buildBookableSlots,
  countAppointmentsInSlot,
  findMatchingGeneratedSlot,
  hasDoctorConflict,
  hasPatientConflict
} from "./slotService.js";

/**
 * Patient identity
 * In your system patient routes use custom userId first.
 */
const getAuthenticatedPatientId = (user = {}) => {
  return String(user.userId || user.id || user._id || "");
};

/**
 * Doctor identity
 * IMPORTANT:
 * Doctor appointments are stored using Doctor Mongo _id,
 * so doctor-side appointment logic must prefer `id` first.
 */
const getAuthenticatedDoctorId = (user = {}) => {
  return String(user.id || user.userId || user._id || "");
};

/**
 * Build optional list filters for GET routes.
 * Example:
 * /mine?status=pending&date=2026-04-12&consultationType=physical
 */
const buildAppointmentFilters = (filters = {}) => {
  const query = {};

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.date) {
    query.appointmentDate = filters.date;
  }

  if (filters.consultationType) {
    query.consultationType = filters.consultationType;
  }

  return query;
};

/**
 * Mark appointment as paid
 */
export const markAppointmentPaid = async (appointmentId, amountPaid) => {
  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  appointment.paymentStatus = "paid";
  appointment.amountPaid = amountPaid;
  await appointment.save();

  console.log(`Appointment saved successfully: ${appointment._id} for patient ${patientId}`);

  return appointment;
};

/**
 * Get bookable slots for a doctor
 */
export const getBookableSlotsForDoctor = async ({
  doctorId,
  date,
  mode = ""
}) => {
  if (!doctorId) {
    throw new Error("doctorId is required");
  }

  if (!date) {
    throw new Error("date is required");
  }

  const doctor = await getDoctorById(doctorId);

  if (!doctor || doctor.approvalStatus !== "approved") {
    throw new Error("Doctor not available");
  }

  const slots = await buildBookableSlots({
    doctorId,
    appointmentDate: date,
    consultationType: mode,
    availability: doctor.availability || []
  });

  return {
    doctor: {
      id: doctor.id,
      fullName: doctor.fullName,
      specialty: doctor.specialty,
      hospital: doctor.hospital
    },
    date,
    mode,
    slots
  };
};

/**
 * Create appointment
 */
export const createAppointment = async (data, user) => {
  const {
    doctorId,
    appointmentDate,
    startTime,
    endTime,
    consultationType,
    reason,
    patientName
  } = data;

  const patientId = getAuthenticatedPatientId(user);

  if (!patientId) {
    throw new Error("Unauthorized");
  }

  // 1. Validate doctor
  const doctor = await getDoctorById(doctorId);

  if (!doctor || doctor.approvalStatus !== "approved") {
    throw new Error("Doctor not available");
  }

  // 2. Verify selected slot is a valid generated slot
  const matched = findMatchingGeneratedSlot({
    availability: doctor.availability || [],
    appointmentDate,
    startTime,
    endTime,
    consultationType
  });

  if (!matched) {
    throw new Error("Selected time slot is not valid for this doctor");
  }

  // 3. Check doctor overlap
  const doctorConflict = await hasDoctorConflict(
    doctorId,
    appointmentDate,
    startTime,
    endTime
  );

  if (doctorConflict) {
    throw new Error("Selected slot is already booked");
  }

  // 4. Check patient overlap
  const patientConflict = await hasPatientConflict(
    patientId,
    appointmentDate,
    startTime,
    endTime
  );

  if (patientConflict) {
    throw new Error("You already have another appointment at this time");
  }

  // 5. Check slot capacity
  const currentCount = await countAppointmentsInSlot({
    doctorId,
    appointmentDate,
    startTime,
    endTime
  });

  const maxPatientsPerSlot = matched.parentWindow.maxPatientsPerSlot || 1;

  if (currentCount >= maxPatientsPerSlot) {
    throw new Error("Selected slot is full");
  }

  // 6. Save appointment
  const appointment = new Appointment({
    patientId,
    doctorId,
    appointmentDate,
    startTime,
    endTime,
    consultationType,
    reason,
    status: "pending",
    doctorName: doctor.fullName,
    doctorSpecialty: doctor.specialty,
    patientName: patientName || ""
  });

  await appointment.save();

  // Send notification
  try {
    const patient = await getPatientById(patientId);
    if (patient?.email) {
      await sendNotification({
        type: "APPOINTMENT_BOOKED",
        recipient: {
          email: patient.email,
          userId: patientId
        },
        data: {
          patientName: patient.fullName || appointment.patientName,
          doctorName: appointment.doctorName,
          appointmentDate: appointment.appointmentDate,
          startTime: appointment.startTime,
          consultationType: appointment.consultationType,
          appointmentId: appointment._id
        }
      });
    }
  } catch (error) {
    console.error("Failed to send booking notification:", error.message);
  }

  return appointment;
};

/**
 * Get single appointment by id
 * Patient and doctor can view only if they belong to it
 */
export const getAppointmentById = async (appointmentId, user) => {
  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  if (!user?.role) {
    throw new Error("Unauthorized");
  }

  const requesterId =
    user.role === "doctor"
      ? getAuthenticatedDoctorId(user)
      : getAuthenticatedPatientId(user);

  if (!requesterId) {
    throw new Error("Unauthorized");
  }

  const isPatientOwner = appointment.patientId?.toString() === requesterId;
  const isDoctorOwner = appointment.doctorId?.toString() === requesterId;

  if (!isPatientOwner && !isDoctorOwner) {
    throw new Error("Unauthorized");
  }

  return appointment;
};

/**
 * Get all appointments for authenticated patient
 */
export const getPatientAppointments = async (user, filters = {}) => {
  const patientId = getAuthenticatedPatientId(user);

  if (!patientId) {
    throw new Error("Unauthorized");
  }

  const query = {
    patientId,
    ...buildAppointmentFilters(filters)
  };

  return Appointment.find(query).sort({
    appointmentDate: 1,
    startTime: 1,
    createdAt: -1
  });
};

/**
 * Get all appointments for authenticated doctor
 */
export const getDoctorAppointments = async (user, filters = {}) => {
  const doctorId = getAuthenticatedDoctorId(user);

  if (!doctorId) {
    throw new Error("Unauthorized");
  }

  const query = {
    doctorId,
    ...buildAppointmentFilters(filters)
  };

  return Appointment.find(query).sort({
    appointmentDate: 1,
    startTime: 1,
    createdAt: -1
  });
};

/**
 * Doctor accepts appointment
 */
export const acceptAppointment = async (appointmentId, user) => {
  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  const doctorId = getAuthenticatedDoctorId(user);

  if (appointment.doctorId.toString() !== doctorId) {
    throw new Error("Unauthorized");
  }

  if (appointment.status !== "pending") {
    throw new Error("Invalid state transition");
  }

  appointment.status = "accepted";
  await appointment.save();

  // Send notification
  try {
    const patient = await getPatientById(appointment.patientId);
    if (patient?.email) {
      await sendNotification({
        type: "APPOINTMENT_ACCEPTED",
        recipient: {
          email: patient.email,
          userId: appointment.patientId
        },
        data: {
          patientName: patient.fullName || appointment.patientName,
          doctorName: appointment.doctorName,
          appointmentDate: appointment.appointmentDate,
          startTime: appointment.startTime,
          consultationType: appointment.consultationType,
          appointmentId: appointment._id
        }
      });
    }
  } catch (error) {
    console.error("Failed to send acceptance notification:", error.message);
  }

  return appointment;
};

/**
 * Doctor rejects appointment
 */
export const rejectAppointment = async (appointmentId, user) => {
  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  const doctorId = getAuthenticatedDoctorId(user);

  if (appointment.doctorId.toString() !== doctorId) {
    throw new Error("Unauthorized");
  }

  if (appointment.status !== "pending") {
    throw new Error("Only pending appointments can be rejected");
  }

  appointment.status = "rejected";
  await appointment.save();

  // Send notification
  try {
    const patient = await getPatientById(appointment.patientId);
    if (patient?.email) {
      await sendNotification({
        type: "APPOINTMENT_REJECTED",
        recipient: {
          email: patient.email,
          userId: appointment.patientId
        },
        data: {
          patientName: patient.fullName || appointment.patientName,
          doctorName: appointment.doctorName,
          appointmentDate: appointment.appointmentDate,
          startTime: appointment.startTime,
          consultationType: appointment.consultationType,
          appointmentId: appointment._id
        }
      });
    }
  } catch (error) {
    console.error("Failed to send rejection notification:", error.message);
  }

  return appointment;
};

/**
 * Calculate refund
 */
const calculateRefund = ({ appointmentDate, startTime, amountPaid }) => {
  const appointmentDateTime = new Date(`${appointmentDate}T${startTime}:00`);
  const now = new Date();

  const diffMs = appointmentDateTime.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours > 48) {
    return {
      eligible: true,
      refundAmount: amountPaid,
      serviceChargeDeducted: 0,
      policy: "full_refund"
    };
  }

  if (diffHours >= 24 && diffHours <= 48) {
    const deduction = 600;
    return {
      eligible: true,
      refundAmount: Math.max(amountPaid - deduction, 0),
      serviceChargeDeducted: deduction,
      policy: "partial_refund"
    };
  }

  return {
    eligible: false,
    refundAmount: 0,
    serviceChargeDeducted: 0,
    policy: "no_refund"
  };
};

/**
 * Patient cancels appointment
 */
export const cancelAppointment = async (appointmentId, data, user) => {
  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  const patientId = getAuthenticatedPatientId(user);

  if (appointment.patientId.toString() !== patientId) {
    throw new Error("Unauthorized");
  }

  if (["completed", "rejected", "cancelled"].includes(appointment.status)) {
    throw new Error(`Cannot cancel ${appointment.status} appointment`);
  }

  const amountPaid = appointment.amountPaid || 0;

  const refund = calculateRefund({
    appointmentDate: appointment.appointmentDate,
    startTime: appointment.startTime,
    amountPaid
  });

  appointment.status = "cancelled";
  appointment.cancelledAt = new Date();
  appointment.cancelledBy = "patient";
  appointment.refundRequested = Boolean(data?.requestRefund);
  appointment.refundReason = data?.refundReason || "";

  if (data?.requestRefund) {
    appointment.refundStatus = refund.eligible ? "pending" : "rejected";
    appointment.refundAmount = refund.refundAmount;
    appointment.serviceChargeDeducted = refund.serviceChargeDeducted;
    appointment.refundPolicy = refund.policy;
  }

  await appointment.save();

  // Send notification
  try {
    const patient = await getPatientById(patientId);
    if (patient?.email) {
      await sendNotification({
        type: "APPOINTMENT_CANCELLED",
        recipient: {
          email: patient.email,
          userId: patientId
        },
        data: {
          patientName: patient.fullName || appointment.patientName,
          doctorName: appointment.doctorName,
          appointmentDate: appointment.appointmentDate,
          startTime: appointment.startTime,
          consultationType: appointment.consultationType,
          appointmentId: appointment._id
        }
      });
    }
  } catch (error) {
    console.error("Failed to send cancellation notification:", error.message);
  }

  return {
    appointment,
    refund
  };
};

/**
 * Doctor completes accepted appointment
 */
export const completeAppointment = async (appointmentId, user) => {
  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  const doctorId = getAuthenticatedDoctorId(user);

  if (appointment.doctorId.toString() !== doctorId) {
    throw new Error("Unauthorized");
  }

  if (appointment.status !== "accepted") {
    throw new Error("Only accepted appointments can be completed");
  }

  appointment.status = "completed";
  await appointment.save();

  return appointment;
};

/**
 * Patient reschedules own appointment
 * After reschedule, status goes back to pending
 */
export const rescheduleAppointment = async (appointmentId, data, user) => {
  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  const patientId = getAuthenticatedPatientId(user);

  if (appointment.patientId.toString() !== patientId) {
    throw new Error("Unauthorized");
  }

  if (["completed", "rejected", "cancelled"].includes(appointment.status)) {
    throw new Error(`Cannot reschedule ${appointment.status} appointment`);
  }

  const nextAppointmentDate = data.appointmentDate;
  const nextStartTime = data.startTime;
  const nextEndTime = data.endTime;
  const nextConsultationType =
    data.consultationType || appointment.consultationType;

  if (!nextAppointmentDate || !nextStartTime || !nextEndTime) {
    throw new Error(
      "appointmentDate, startTime, and endTime are required to reschedule"
    );
  }

  const doctor = await getDoctorById(String(appointment.doctorId));

  if (!doctor || doctor.approvalStatus !== "approved") {
    throw new Error("Doctor not available");
  }

  const matched = findMatchingGeneratedSlot({
    availability: doctor.availability || [],
    appointmentDate: nextAppointmentDate,
    startTime: nextStartTime,
    endTime: nextEndTime,
    consultationType: nextConsultationType
  });

  if (!matched) {
    throw new Error("Selected time slot is not valid for this doctor");
  }

  const doctorConflict = await hasDoctorConflict(
    String(appointment.doctorId),
    nextAppointmentDate,
    nextStartTime,
    nextEndTime,
    appointmentId
  );

  if (doctorConflict) {
    throw new Error("Selected slot is already booked");
  }

  const patientConflict = await hasPatientConflict(
    patientId,
    nextAppointmentDate,
    nextStartTime,
    nextEndTime,
    appointmentId
  );

  if (patientConflict) {
    throw new Error("You already have another appointment at this time");
  }

  const currentCount = await countAppointmentsInSlot({
    doctorId: String(appointment.doctorId),
    appointmentDate: nextAppointmentDate,
    startTime: nextStartTime,
    endTime: nextEndTime,
    excludeAppointmentId: appointmentId
  });

  const maxPatientsPerSlot = matched.parentWindow.maxPatientsPerSlot || 1;

  if (currentCount >= maxPatientsPerSlot) {
    throw new Error("Selected slot is full");
  }

  appointment.appointmentDate = nextAppointmentDate;
  appointment.startTime = nextStartTime;
  appointment.endTime = nextEndTime;
  appointment.consultationType = nextConsultationType;

  // after changing time, doctor should confirm again
  appointment.status = "pending";

  if (data.reason) {
    appointment.reason = data.reason;
  }

  await appointment.save();

  return appointment;
};

/**
 * Internal helper:
 * Validate a proposed reschedule slot against doctor availability,
 * doctor conflicts, patient conflicts, and slot capacity.
 */
const validateDoctorRescheduleProposal = async ({
  appointment,
  appointmentId,
  appointmentDate,
  startTime,
  endTime,
  consultationType
}) => {
  const doctor = await getDoctorById(String(appointment.doctorId));

  if (!doctor || doctor.approvalStatus !== "approved") {
    throw new Error("Doctor not available");
  }

  const matched = findMatchingGeneratedSlot({
    availability: doctor.availability || [],
    appointmentDate,
    startTime,
    endTime,
    consultationType
  });

  if (!matched) {
    throw new Error("Selected time slot is not valid for this doctor");
  }

  const doctorConflict = await hasDoctorConflict(
    String(appointment.doctorId),
    appointmentDate,
    startTime,
    endTime,
    appointmentId
  );

  if (doctorConflict) {
    throw new Error("Selected slot is already booked");
  }

  const patientConflict = await hasPatientConflict(
    String(appointment.patientId),
    appointmentDate,
    startTime,
    endTime,
    appointmentId
  );

  if (patientConflict) {
    throw new Error("Patient already has another appointment at this time");
  }

  const currentCount = await countAppointmentsInSlot({
    doctorId: String(appointment.doctorId),
    appointmentDate,
    startTime,
    endTime,
    excludeAppointmentId: appointmentId
  });

  const maxPatientsPerSlot = matched.parentWindow.maxPatientsPerSlot || 1;

  if (currentCount >= maxPatientsPerSlot) {
    throw new Error("Selected slot is full");
  }

  return { doctor, matched };
};

/**
 * Doctor proposes a new slot to the patient.
 * This does NOT immediately change the appointment time.
 * It stores the proposal and waits for patient response.
 */
export const doctorRescheduleAppointment = async (
  appointmentId,
  data,
  user
) => {
  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  const doctorId = getAuthenticatedDoctorId(user);

  if (appointment.doctorId.toString() !== doctorId) {
    throw new Error("Unauthorized");
  }

  if (["completed", "rejected", "cancelled"].includes(appointment.status)) {
    throw new Error(
      `Cannot propose reschedule for ${appointment.status} appointment`
    );
  }

  const nextAppointmentDate = data.appointmentDate;
  const nextStartTime = data.startTime;
  const nextEndTime = data.endTime;
  const nextConsultationType =
    data.consultationType || appointment.consultationType;

  if (!nextAppointmentDate || !nextStartTime || !nextEndTime) {
    throw new Error(
      "appointmentDate, startTime, and endTime are required for doctor reschedule"
    );
  }

  await validateDoctorRescheduleProposal({
    appointment,
    appointmentId,
    appointmentDate: nextAppointmentDate,
    startTime: nextStartTime,
    endTime: nextEndTime,
    consultationType: nextConsultationType
  });

  appointment.doctorRescheduleStatus = "pending";
  appointment.doctorProposedAppointmentDate = nextAppointmentDate;
  appointment.doctorProposedStartTime = nextStartTime;
  appointment.doctorProposedEndTime = nextEndTime;
  appointment.doctorProposedConsultationType = nextConsultationType;
  appointment.doctorRescheduleReason = data.reason || data.note || "";
  appointment.doctorRescheduleProposedAt = new Date();
  appointment.doctorRescheduleRespondedAt = null;

  await appointment.save();

  return appointment;
};

/**
 * Patient accepts doctor's proposed reschedule.
 * Now the main appointment date/time is updated.
 */
export const acceptDoctorReschedule = async (appointmentId, user) => {
  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  const patientId = getAuthenticatedPatientId(user);

  if (appointment.patientId.toString() !== patientId) {
    throw new Error("Unauthorized");
  }

  if (appointment.doctorRescheduleStatus !== "pending") {
    throw new Error("No pending doctor reschedule proposal found");
  }

  const nextAppointmentDate = appointment.doctorProposedAppointmentDate;
  const nextStartTime = appointment.doctorProposedStartTime;
  const nextEndTime = appointment.doctorProposedEndTime;
  const nextConsultationType =
    appointment.doctorProposedConsultationType || appointment.consultationType;

  if (!nextAppointmentDate || !nextStartTime || !nextEndTime) {
    throw new Error("Doctor reschedule proposal is incomplete");
  }

  await validateDoctorRescheduleProposal({
    appointment,
    appointmentId,
    appointmentDate: nextAppointmentDate,
    startTime: nextStartTime,
    endTime: nextEndTime,
    consultationType: nextConsultationType
  });

  appointment.appointmentDate = nextAppointmentDate;
  appointment.startTime = nextStartTime;
  appointment.endTime = nextEndTime;
  appointment.consultationType = nextConsultationType;

  appointment.doctorRescheduleStatus = "accepted";
  appointment.doctorRescheduleRespondedAt = new Date();

  await appointment.save();

  return appointment;
};

/**
 * Patient rejects doctor's proposed reschedule.
 * Appointment gets cancelled and refund flow is recorded.
 * Since the doctor initiated the time change, this uses full refund policy.
 */
export const rejectDoctorReschedule = async (
  appointmentId,
  data,
  user
) => {
  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  const patientId = getAuthenticatedPatientId(user);

  if (appointment.patientId.toString() !== patientId) {
    throw new Error("Unauthorized");
  }

  if (appointment.doctorRescheduleStatus !== "pending") {
    throw new Error("No pending doctor reschedule proposal found");
  }

  if (["completed", "rejected", "cancelled"].includes(appointment.status)) {
    throw new Error(
      `Cannot reject doctor reschedule for ${appointment.status} appointment`
    );
  }

  const amountPaid = appointment.amountPaid || 0;

  const refund = {
    eligible: true,
    refundAmount: amountPaid,
    serviceChargeDeducted: 0,
    policy: "doctor_reschedule_rejected_full_refund"
  };

  appointment.status = "cancelled";
  appointment.cancelledAt = new Date();
  appointment.cancelledBy = "patient";

  appointment.refundRequested = true;
  appointment.refundReason =
    data?.refundReason ||
    data?.reason ||
    "Patient rejected doctor's reschedule proposal";
  appointment.refundStatus = "pending";
  appointment.refundAmount = refund.refundAmount;
  appointment.serviceChargeDeducted = refund.serviceChargeDeducted;
  appointment.refundPolicy = refund.policy;

  appointment.doctorRescheduleStatus = "rejected";
  appointment.doctorRescheduleRespondedAt = new Date();

  await appointment.save();

  return {
    appointment,
    refund
  };
};