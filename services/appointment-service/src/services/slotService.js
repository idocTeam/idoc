// src/services/slotService.js

import Appointment from "../models/Appointment.js";

/**
 * Convert HH:MM to minutes
 */
export const toMinutes = (time = "") => {
  if (!time || typeof time !== "string" || !time.includes(":")) return null;

  const [h, m] = time.split(":").map(Number);

  if (
    Number.isNaN(h) ||
    Number.isNaN(m) ||
    h < 0 ||
    h > 23 ||
    m < 0 ||
    m > 59
  ) {
    return null;
  }

  return h * 60 + m;
};

/**
 * Check overlapping time ranges
 */
export const isOverlapping = (startA, endA, startB, endB) => {
  const aStart = toMinutes(startA);
  const aEnd = toMinutes(endA);
  const bStart = toMinutes(startB);
  const bEnd = toMinutes(endB);

  if (
    aStart === null ||
    aEnd === null ||
    bStart === null ||
    bEnd === null
  ) {
    return false;
  }

  return aStart < bEnd && bStart < aEnd;
};

/**
 * Convert YYYY-MM-DD to weekday name
 */
export const getDayName = (dateStr) => {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ];

  return days[new Date(dateStr).getDay()];
};

/**
 * Return availability windows that match a specific date + mode
 */
export const findMatchingAvailabilityWindows = ({
  availability = [],
  appointmentDate,
  consultationType
}) => {
  const requestedDay = getDayName(appointmentDate);
  const requestedMode = (consultationType || "").toLowerCase();

  return availability.filter((slot) => {
    if (!slot.isAvailable) return false;

    if (slot.type === "specificDate") {
      if (slot.date !== appointmentDate) return false;
    } else {
      if (slot.day !== requestedDay) return false;
    }

    const slotMode = (slot.mode || "").toLowerCase();

    const modeMatches =
      !requestedMode ||
      slotMode === requestedMode ||
      slotMode === "both" ||
      requestedMode === "both";

    return modeMatches;
  });
};

/**
 * Find one exact generated sub-slot that matches patient selection
 */
export const findMatchingGeneratedSlot = ({
  availability = [],
  appointmentDate,
  startTime,
  endTime,
  consultationType
}) => {
  const matchingWindows = findMatchingAvailabilityWindows({
    availability,
    appointmentDate,
    consultationType
  });

  for (const windowSlot of matchingWindows) {
    const generatedSlots = Array.isArray(windowSlot.generatedSlots)
      ? windowSlot.generatedSlots
      : [];

    const matchedSubSlot = generatedSlots.find(
      (sub) => sub.startTime === startTime && sub.endTime === endTime
    );

    if (matchedSubSlot) {
      return {
        parentWindow: windowSlot,
        selectedSlot: matchedSubSlot
      };
    }
  }

  return null;
};

/**
 * Check whether doctor already has appointment at this exact/overlapping time
 */
export const hasDoctorConflict = async (doctorId, date, start, end) => {
  const appointments = await Appointment.find({
    doctorId,
    appointmentDate: date,
    status: { $in: ["pending", "accepted"] }
  });

  return appointments.some((app) =>
    isOverlapping(start, end, app.startTime, app.endTime)
  );
};

/**
 * Check whether patient already has appointment at this time
 */
export const hasPatientConflict = async (patientId, date, start, end) => {
  const appointments = await Appointment.find({
    patientId,
    appointmentDate: date,
    status: { $in: ["pending", "accepted"] }
  });

  return appointments.some((app) =>
    isOverlapping(start, end, app.startTime, app.endTime)
  );
};

/**
 * Count active appointments in one exact sub-slot
 */
export const countAppointmentsInSlot = async ({
  doctorId,
  appointmentDate,
  startTime,
  endTime
}) => {
  return Appointment.countDocuments({
    doctorId,
    appointmentDate,
    startTime,
    endTime,
    status: { $in: ["pending", "accepted"] }
  });
};

/**
 * Build all slots for doctor/date and mark booked/free
 */
export const buildBookableSlots = async ({
  doctorId,
  appointmentDate,
  consultationType,
  availability = []
}) => {
  const matchingWindows = findMatchingAvailabilityWindows({
    availability,
    appointmentDate,
    consultationType
  });

  const activeAppointments = await Appointment.find({
    doctorId,
    appointmentDate,
    status: { $in: ["pending", "accepted"] }
  }).select("startTime endTime");

  const bookedSet = new Set(
    activeAppointments.map((app) => `${app.startTime}-${app.endTime}`)
  );

  const slots = [];

  for (const windowSlot of matchingWindows) {
    const generatedSlots = Array.isArray(windowSlot.generatedSlots)
      ? windowSlot.generatedSlots
      : [];

    for (const sub of generatedSlots) {
      const key = `${sub.startTime}-${sub.endTime}`;

      slots.push({
        startTime: sub.startTime,
        endTime: sub.endTime,
        isBooked: bookedSet.has(key),
        mode: windowSlot.mode,
        sourceWindow: {
          type: windowSlot.type,
          day: windowSlot.day,
          date: windowSlot.date,
          startTime: windowSlot.startTime,
          endTime: windowSlot.endTime
        }
      });
    }
  }

  return slots;
};