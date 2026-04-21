import Doctor from "../models/Doctor.js";
import Availability from "../models/Availability.js";
import {generateSubSlots} from "../utils/slotGenerator.js";
// ---------------------------------------------------
// Helpers
// ---------------------------------------------------

// Normalize one slot so the API stays flexible
const normalizeSlot = (slot = {}) => {
  return {
    _id: slot._id || undefined,
    type: slot.type || "recurring",
    day: slot.day || "",
    date: slot.date || "",
    startTime: slot.startTime || "",
    endTime: slot.endTime || "",
    slotDurationMinutes:
      Number.isInteger(slot.slotDurationMinutes) && slot.slotDurationMinutes > 0
        ? slot.slotDurationMinutes
        : 15,
    bufferMinutes:
      Number.isInteger(slot.bufferMinutes) && slot.bufferMinutes >= 0
        ? slot.bufferMinutes
        : 0,
    mode: slot.mode || slot.consultationMode || "online",
    isAvailable:
      typeof slot.isAvailable === "boolean"
        ? slot.isAvailable
        : typeof slot.available === "boolean"
        ? slot.available
        : true,
    maxPatientsPerSlot:
      Number.isInteger(slot.maxPatientsPerSlot) && slot.maxPatientsPerSlot > 0
        ? slot.maxPatientsPerSlot
        : Number.isInteger(slot.maxPatients) && slot.maxPatients > 0
        ? slot.maxPatients
        : 1
  };
};

// Generate Sub slots
const attachGeneratedSubSlots = (slot = {}) => {
  const normalized = normalizeSlot(slot);

  return {
    ...normalized,
    generatedSlots: generateSubSlots(
      normalized.startTime,
      normalized.endTime,
      normalized.slotDurationMinutes,
      normalized.bufferMinutes
    )
  };
};

const attachGeneratedSubSlotsToArray = (availability = []) => {
  return normalizeAvailabilityArray(availability).map(attachGeneratedSubSlots);
};

// Normalize full array
const normalizeAvailabilityArray = (availability = []) => {
  if (!Array.isArray(availability)) return [];
  return availability.map(normalizeSlot);
};

// Convert HH:MM into minutes for comparison
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

// Validate one slot
const isValidSlot = (slot = {}) => {
  
  const hasValidType =
    slot.type === "recurring" || slot.type === "specificDate";

  if (!hasValidType) return false;

  if (slot.type === "recurring" && !slot.day) return false;
  if (slot.type === "specificDate" && !slot.date) return false;
  
  if (!slot.day && !slot.date) return false;
  if (!slot.startTime || !slot.endTime) return false;

  const start = toMinutes(slot.startTime);
  const end = toMinutes(slot.endTime);
  

  if (start === null || end === null) return false;
  if (start >= end) return false;

  if (
    !Number.isInteger(slot.slotDurationMinutes) ||
    slot.slotDurationMinutes < 5
  ) {
    return false;
  }

  if (
    !Number.isInteger(slot.bufferMinutes) ||
    slot.bufferMinutes < 0
  ) {
    return false;
  }

  if (
    !Number.isInteger(slot.maxPatientsPerSlot) ||
    slot.maxPatientsPerSlot < 1
  ) {
    return false;
  }

  if (slot.slotDurationMinutes > end - start) return false;

  return true;
};

// Reusable query builder for approved doctors
const buildApprovedDoctorQuery = () => {
  const query = { approvalStatus: "approved" };

  if (Doctor.schema.path("isActive")) {
    query.isActive = true;
  }

  return query;
};

// Slot filter matcher for public filter route
const slotMatchesFilters = (slot, filters) => {
  const normalized = normalizeSlot(slot);

  if (filters.day) {
    if (!normalized.day) return false;
    if (normalized.day.toLowerCase() !== filters.day.toLowerCase()) return false;
  }

  if (filters.date) {
    if (!normalized.date) return false;
    if (normalized.date !== filters.date) return false;
  }

  if (filters.mode) {
    const slotMode = (normalized.mode || "").toLowerCase();
    const requestedMode = filters.mode.toLowerCase();

    const modeMatches =
      slotMode === requestedMode ||
      slotMode === "both" ||
      requestedMode === "both";

    if (!modeMatches) return false;
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

// Find doctor self safely
const findDoctorByAuthUser = async (doctorId) => {
  return Doctor.findById(doctorId).select("_id fullName specialty hospital approvalStatus isActive");
};

// ---------------------------------------------------
// Doctor self availability CRUD
// ---------------------------------------------------

export const getMyAvailability = async (req, res) => {
  try {
    const doctor = await findDoctorByAuthUser(req.user.id);

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found."
      });
    }

    const availabilityDoc = await Availability.findOne({ doctorId: doctor._id });

    return res.status(200).json({
      availability: availabilityDoc
        ? attachGeneratedSubSlotsToArray(availabilityDoc.slots)
        : []
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

    const doctor = await findDoctorByAuthUser(req.user.id);

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found."
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

    const updatedAvailability = await Availability.findOneAndUpdate(
      { doctorId: doctor._id },
      {
        $set: {
          doctorId: doctor._id,
          slots: normalizedAvailability
        }
      },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );

    return res.status(200).json({
      message: "Doctor availability updated successfully.",
      availability: attachGeneratedSubSlotsToArray(updatedAvailability.slots)
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

    const doctor = await findDoctorByAuthUser(req.user.id);

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found."
      });
    }

    let availabilityDoc = await Availability.findOne({ doctorId: doctor._id });

    if (!availabilityDoc) {
      availabilityDoc = await Availability.create({
        doctorId: doctor._id,
        slots: []
      });
    }

    availabilityDoc.slots.push(slot);
    await availabilityDoc.save();

    return res.status(201).json({
      message: "Availability slot added successfully.",
      availability: attachGeneratedSubSlotsToArray(availabilityDoc.slots)
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to add availability slot.",
      error: error.message
    });
  }
};

export const updateAvailabilitySlot = async (req, res) => {
  try {
    // Get slot index from URL
    const { index } = req.params;
    const slotIndex = Number(index);

    // Validate index
    if (Number.isNaN(slotIndex) || slotIndex < 0) {
      return res.status(400).json({
        message: "Valid availability slot index is required."
      });
    }

    // Find logged-in doctor
    const doctor = await findDoctorByAuthUser(req.user.id);

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found."
      });
    }

    // Find availability document
    const availabilityDoc = await Availability.findOne({ doctorId: doctor._id });

    if (!availabilityDoc || !Array.isArray(availabilityDoc.slots)) {
      return res.status(404).json({
        message: "Availability not found."
      });
    }

    // Check whether slot exists
    if (!availabilityDoc.slots[slotIndex]) {
      return res.status(404).json({
        message: "Availability slot not found."
      });
    }

    // Normalize new slot data from request body
    const updatedSlot = normalizeSlot(req.body);

    // Validate new slot
    if (!isValidSlot(updatedSlot)) {
      return res.status(400).json({
        message:
          "Slot must include day or date, startTime, and endTime. startTime must be before endTime."
      });
    }

    // Replace only the selected slot
    availabilityDoc.slots[slotIndex] = updatedSlot;

    // Save updated document
    await availabilityDoc.save();

    return res.status(200).json({
      message: "Availability slot updated successfully.",
      slot: attachGeneratedSubSlots(availabilityDoc.slots[slotIndex]),
      availability: attachGeneratedSubSlotsToArray(availabilityDoc.slots)
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update availability slot.",
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

    const doctor = await findDoctorByAuthUser(req.user.id);

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found."
      });
    }

    const availabilityDoc = await Availability.findOne({ doctorId: doctor._id });

    if (!availabilityDoc || !Array.isArray(availabilityDoc.slots)) {
      return res.status(404).json({
        message: "Availability not found."
      });
    }

    if (!availabilityDoc.slots[slotIndex]) {
      return res.status(404).json({
        message: "Availability slot not found."
      });
    }

    availabilityDoc.slots.splice(slotIndex, 1);
    await availabilityDoc.save();

    return res.status(200).json({
      message: "Availability slot removed successfully.",
      availability: attachGeneratedSubSlotsToArray(availabilityDoc.slots)
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

    const doctor = await findDoctorByAuthUser(req.user.id);

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found."
      });
    }

    const availabilityDoc = await Availability.findOne({ doctorId: doctor._id });

    if (!availabilityDoc || !Array.isArray(availabilityDoc.slots)) {
      return res.status(404).json({
        message: "Availability not found."
      });
    }

    if (!availabilityDoc.slots[slotIndex]) {
      return res.status(404).json({
        message: "Availability slot not found."
      });
    }

    availabilityDoc.slots[slotIndex].isAvailable =
      !availabilityDoc.slots[slotIndex].isAvailable;

    await availabilityDoc.save();

    return res.status(200).json({
      message: "Availability slot status updated successfully.",
      slot: attachGeneratedSubSlots(availabilityDoc.slots[slotIndex]),
      availability: attachGeneratedSubSlotsToArray(availabilityDoc.slots)
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
    }).select("fullName specialty hospital");

    if (!doctor) {
      return res.status(404).json({
        message: "Approved doctor not found."
      });
    }

    const availabilityDoc = await Availability.findOne({ doctorId: doctor._id });

    return res.status(200).json({
      doctor: {
        id: doctor._id,
        fullName: doctor.fullName,
        specialty: doctor.specialty,
        hospital: doctor.hospital,
        availability: availabilityDoc
          ? attachGeneratedSubSlotsToArray(availabilityDoc.slots)
          : []
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

    const approvedDoctors = await Doctor.find(buildApprovedDoctorQuery()).select(
      "fullName specialty qualifications hospital consultationFee bio experienceYears photoPath"
    );

    if (approvedDoctors.length === 0) {
      return res.status(200).json({
        total: 0,
        page: parsedPage,
        totalPages: 0,
        doctors: []
      });
    }

    const doctorIds = approvedDoctors.map((doctor) => doctor._id);

    const availabilityDocs = await Availability.find({
      doctorId: { $in: doctorIds }
    }).select("doctorId slots");

    const availabilityMap = new Map(
      availabilityDocs.map((doc) => [doc.doctorId.toString(), doc])
    );

    const matchedDoctors = approvedDoctors
      .map((doctor) => {
        const availabilityDoc = availabilityMap.get(doctor._id.toString());

        const matchedSlots = normalizeAvailabilityArray(
          availabilityDoc?.slots || []
        ).filter((slot) => slotMatchesFilters(slot, filters));

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
          photoPath: doctor.photoPath,
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


// getDoctorBookingContextById 

export const getDoctorBookingContextById = async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await Doctor.findById(id).select(
      "_id fullName specialty hospital photoPath approvalStatus isActive"
    );

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found."
      });
    }

    if (doctor.approvalStatus !== "approved") {
      return res.status(404).json({
        message: "Doctor is not approved for booking."
      });
    }

    if (Doctor.schema.path("isActive") && doctor.isActive === false) {
      return res.status(404).json({
        message: "Doctor is inactive."
      });
    }

    const availabilityDoc = await Availability.findOne({ doctorId: doctor._id });

    return res.status(200).json({
      doctor: {
        id: doctor._id,
        fullName: doctor.fullName,
        specialty: doctor.specialty,
        hospital: doctor.hospital,
        photoPath: doctor.photoPath,
        approvalStatus: doctor.approvalStatus,
        isActive: doctor.isActive ?? true,
        availability: availabilityDoc
          ? attachGeneratedSubSlotsToArray(availabilityDoc.slots)
          : []
      }
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch doctor booking context.",
      error: error.message
    });
  }
};