import Doctor from "../models/Doctor.js";

// ---------------------------------------------------
// Helpers
// ---------------------------------------------------

// Normalize slot shape so the controller stays flexible
const normalizeSlot = (slot = {}) => {
  return {
    day: slot.day || "",
    date: slot.date || "",
    startTime: slot.startTime || "",
    endTime: slot.endTime || "",
    mode: slot.mode || slot.consultationMode || "online",
    isAvailable:
      typeof slot.isAvailable === "boolean"
        ? slot.isAvailable
        : typeof slot.available === "boolean"
        ? slot.available
        : true
  };
};

const normalizeAvailabilityArray = (availability = []) => {
  if (!Array.isArray(availability)) return [];
  return availability.map(normalizeSlot);
};

const toMinutes = (time = "") => {
  if (!time || typeof time !== "string" || !time.includes(":")) return null;

  const [hours, minutes] = time.split(":").map(Number);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
};

const isValidSlot = (slot = {}) => {
  if (!slot.day && !slot.date) return false;
  if (!slot.startTime || !slot.endTime) return false;

  const start = toMinutes(slot.startTime);
  const end = toMinutes(slot.endTime);

  if (start === null || end === null) return false;
  if (start >= end) return false;

  return true;
};

const buildApprovedDoctorQuery = () => {
  const query = { approvalStatus: "approved" };

  if (Doctor.schema.path("isActive")) {
    query.isActive = true;
  }

  return query;
};

const slotMatchesFilters = (slot, filters) => {
  const normalized = normalizeSlot(slot);

  if (filters.day && normalized.day) {
    if (normalized.day.toLowerCase() !== filters.day.toLowerCase()) {
      return false;
    }
  } else if (filters.day && !normalized.day) {
    return false;
  }

  if (filters.date && normalized.date) {
    if (normalized.date !== filters.date) {
      return false;
    }
  } else if (filters.date && !normalized.date) {
    return false;
  }

  if (filters.mode) {
    const slotMode = (normalized.mode || "").toLowerCase();
    const requestedMode = filters.mode.toLowerCase();

    const modeMatches =
      slotMode === requestedMode ||
      slotMode === "both" ||
      requestedMode === "both";

    if (!modeMatches) {
      return false;
    }
  }

  if (filters.time) {
    const requestedTime = toMinutes(filters.time);
    const slotStart = toMinutes(normalized.startTime);
    const slotEnd = toMinutes(normalized.endTime);

    if (
      requestedTime === null ||
      slotStart === null ||
      slotEnd === null ||
      requestedTime < slotStart ||
      requestedTime >= slotEnd
    ) {
      return false;
    }
  }

  if (filters.onlyAvailable && normalized.isAvailable !== true) {
    return false;
  }

  return true;
};

// ---------------------------------------------------
// Doctor self availability
// ---------------------------------------------------

export const getMyAvailability = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.user.id).select("availability");

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found."
      });
    }

    return res.status(200).json({
      availability: normalizeAvailabilityArray(doctor.availability)
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch doctor availability.",
      error: error.message
    });
  }
};

export const upsertMyAvailability = async (req, res) => {
  try {
    const { availability } = req.body;

    if (!Array.isArray(availability)) {
      return res.status(400).json({
        message: "Availability must be an array."
      });
    }

    const normalizedAvailability = normalizeAvailabilityArray(availability);

    const invalidSlot = normalizedAvailability.find((slot) => !isValidSlot(slot));

    if (invalidSlot) {
      return res.status(400).json({
        message:
          "Each availability slot must include day or date, startTime, and endTime. startTime must be before endTime."
      });
    }

    const doctor = await Doctor.findById(req.user.id);

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found."
      });
    }

    doctor.availability = normalizedAvailability;
    await doctor.save();

    return res.status(200).json({
      message: "Doctor availability updated successfully.",
      availability: doctor.availability
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update doctor availability.",
      error: error.message
    });
  }
};

export const addAvailabilitySlot = async (req, res) => {
  try {
    const slot = normalizeSlot(req.body);

    if (!isValidSlot(slot)) {
      return res.status(400).json({
        message:
          "Slot must include day or date, startTime, and endTime. startTime must be before endTime."
      });
    }

    const doctor = await Doctor.findById(req.user.id);

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found."
      });
    }

    if (!Array.isArray(doctor.availability)) {
      doctor.availability = [];
    }

    doctor.availability.push(slot);
    await doctor.save();

    return res.status(201).json({
      message: "Availability slot added successfully.",
      availability: doctor.availability
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to add availability slot.",
      error: error.message
    });
  }
};

export const removeAvailabilitySlot = async (req, res) => {
  try {
    const { index } = req.params;
    const slotIndex = Number(index);

    if (Number.isNaN(slotIndex) || slotIndex < 0) {
      return res.status(400).json({
        message: "Valid availability slot index is required."
      });
    }

    const doctor = await Doctor.findById(req.user.id);

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found."
      });
    }

    if (!Array.isArray(doctor.availability) || !doctor.availability[slotIndex]) {
      return res.status(404).json({
        message: "Availability slot not found."
      });
    }

    doctor.availability.splice(slotIndex, 1);
    await doctor.save();

    return res.status(200).json({
      message: "Availability slot removed successfully.",
      availability: doctor.availability
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to remove availability slot.",
      error: error.message
    });
  }
};

export const toggleAvailabilityStatus = async (req, res) => {
  try {
    const { index } = req.params;
    const slotIndex = Number(index);

    if (Number.isNaN(slotIndex) || slotIndex < 0) {
      return res.status(400).json({
        message: "Valid availability slot index is required."
      });
    }

    const doctor = await Doctor.findById(req.user.id);

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found."
      });
    }

    if (!Array.isArray(doctor.availability) || !doctor.availability[slotIndex]) {
      return res.status(404).json({
        message: "Availability slot not found."
      });
    }

    const currentSlot = normalizeSlot(doctor.availability[slotIndex]);
    currentSlot.isAvailable = !currentSlot.isAvailable;

    doctor.availability[slotIndex] = currentSlot;
    await doctor.save();

    return res.status(200).json({
      message: "Availability slot status updated successfully.",
      slot: doctor.availability[slotIndex],
      availability: doctor.availability
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to toggle availability slot status.",
      error: error.message
    });
  }
};

// ---------------------------------------------------
// Public / internal doctor availability
// ---------------------------------------------------

export const getDoctorAvailabilityById = async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await Doctor.findOne({
      _id: id,
      ...buildApprovedDoctorQuery()
    }).select("fullName specialty hospital availability");

    if (!doctor) {
      return res.status(404).json({
        message: "Approved doctor not found."
      });
    }

    return res.status(200).json({
      doctor: {
        id: doctor._id,
        fullName: doctor.fullName,
        specialty: doctor.specialty,
        hospital: doctor.hospital,
        availability: normalizeAvailabilityArray(doctor.availability)
      }
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch doctor availability by ID.",
      error: error.message
    });
  }
};

export const filterDoctorsByAvailability = async (req, res) => {
  try {
    const {
      day = "",
      date = "",
      time = "",
      mode = "",
      page = 1,
      limit = 10
    } = req.query;

    const parsedPage = Math.max(Number(page) || 1, 1);
    const parsedLimit = Math.max(Number(limit) || 10, 1);
    const skip = (parsedPage - 1) * parsedLimit;

    const filters = {
      day: day.trim(),
      date: date.trim(),
      time: time.trim(),
      mode: mode.trim(),
      onlyAvailable: true
    };

    const hasAtLeastOneFilter =
      filters.day || filters.date || filters.time || filters.mode;

    if (!hasAtLeastOneFilter) {
      return res.status(400).json({
        message:
          "At least one filter is required: day, date, time, or mode."
      });
    }

    const doctors = await Doctor.find(buildApprovedDoctorQuery()).select(
      "fullName specialty qualifications hospital consultationFee bio experienceYears availability"
    );

    const matchedDoctors = doctors
      .map((doctor) => {
        const matchedSlots = normalizeAvailabilityArray(doctor.availability).filter(
          (slot) => slotMatchesFilters(slot, filters)
        );

        if (matchedSlots.length === 0) {
          return null;
        }

        return {
          id: doctor._id,
          fullName: doctor.fullName,
          specialty: doctor.specialty,
          qualifications: doctor.qualifications,
          hospital: doctor.hospital,
          consultationFee: doctor.consultationFee,
          bio: doctor.bio,
          experienceYears: doctor.experienceYears,
          matchedAvailability: matchedSlots
        };
      })
      .filter(Boolean);

    const total = matchedDoctors.length;
    const paginatedDoctors = matchedDoctors.slice(skip, skip + parsedLimit);

    return res.status(200).json({
      total,
      page: parsedPage,
      totalPages: Math.ceil(total / parsedLimit),
      doctors: paginatedDoctors
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to filter doctors by availability.",
      error: error.message
    });
  }
};