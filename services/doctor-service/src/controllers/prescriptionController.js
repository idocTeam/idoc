import mongoose from "mongoose";
import Prescription from "../models/Prescription.js";
import Doctor from "../models/Doctor.js";

// ---------------------------------------------------
// Helpers
// ---------------------------------------------------

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const normalizeMedicines = (medicines = []) => {
  if (!Array.isArray(medicines)) return [];

  return medicines
    .map((item) => ({
      name: item?.name?.trim?.() || "",
      dosage: item?.dosage?.trim?.() || "",
      frequency: item?.frequency?.trim?.() || "",
      duration: item?.duration?.trim?.() || "",
      instructions: item?.instructions?.trim?.() || ""
    }))
    .filter((item) => item.name);
};

const buildDoctorPrescriptionQuery = (doctorId, extra = {}) => {
  return {
    doctorId,
    ...extra
  };
};

// ---------------------------------------------------
// Create prescription
// ---------------------------------------------------

export const createPrescription = async (req, res) => {
  try {
    const {
      patientId,
      appointmentId,
      diagnosis,
      medicines,
      notes,
      followUpDate
    } = req.body;

    // Basic validation
    if (!patientId) {
      return res.status(400).json({
        message: "patientId is required."
      });
    }

    if (!isValidObjectId(patientId)) {
      return res.status(400).json({
        message: "Invalid patientId."
      });
    }

    if (appointmentId && !isValidObjectId(appointmentId)) {
      return res.status(400).json({
        message: "Invalid appointmentId."
      });
    }

    const normalizedMedicines = normalizeMedicines(medicines);

    if (normalizedMedicines.length === 0) {
      return res.status(400).json({
        message: "At least one medicine is required."
      });
    }

    const prescription = await Prescription.create({
      doctorId: req.user.id,
      patientId,
      appointmentId: appointmentId || null,
      diagnosis: diagnosis?.trim?.() || "",
      medicines: normalizedMedicines,
      notes: notes?.trim?.() || "",
      followUpDate: followUpDate || null,
      status: "active"
    });

    return res.status(201).json({
      message: "Prescription created successfully.",
      prescription
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create prescription.",
      error: error.message
    });
  }
};

// ---------------------------------------------------
// Get all prescriptions issued by current doctor
// ---------------------------------------------------

export const getMyIssuedPrescriptions = async (req, res) => {
  try {
    const {
      patientId = "",
      appointmentId = "",
      status = "",
      page = 1,
      limit = 10
    } = req.query;

    const parsedPage = Math.max(Number(page) || 1, 1);
    const parsedLimit = Math.max(Number(limit) || 10, 1);
    const skip = (parsedPage - 1) * parsedLimit;

    const query = buildDoctorPrescriptionQuery(req.user.id);

    if (patientId) {
      if (!isValidObjectId(patientId)) {
        return res.status(400).json({
          message: "Invalid patientId."
        });
      }
      query.patientId = patientId;
    }

    if (appointmentId) {
      if (!isValidObjectId(appointmentId)) {
        return res.status(400).json({
          message: "Invalid appointmentId."
        });
      }
      query.appointmentId = appointmentId;
    }

    if (status) {
      query.status = status;
    }

    const [prescriptions, total] = await Promise.all([
      Prescription.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit),
      Prescription.countDocuments(query)
    ]);

    return res.status(200).json({
      total,
      page: parsedPage,
      totalPages: Math.ceil(total / parsedLimit),
      prescriptions
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch issued prescriptions.",
      error: error.message
    });
  }
};

// ---------------------------------------------------
// Patient: Get my prescriptions
// ---------------------------------------------------

export const getMyPatientPrescriptions = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = "" } = req.query;

    const parsedPage = Math.max(Number(page) || 1, 1);
    const parsedLimit = Math.max(Number(limit) || 20, 1);
    const skip = (parsedPage - 1) * parsedLimit;

    const query = { patientId: req.user.id };
    if (status) query.status = status;

    const [prescriptions, total] = await Promise.all([
      Prescription.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit),
      Prescription.countDocuments(query)
    ]);

    const doctorIds = Array.from(
      new Set((prescriptions || []).map((p) => String(p?.doctorId || "")).filter(Boolean))
    );

    const doctors = doctorIds.length
      ? await Doctor.find({ _id: { $in: doctorIds } }).select("fullName specialty userId")
      : [];

    const doctorById = new Map(doctors.map((d) => [String(d._id), d]));

    const enriched = (prescriptions || []).map((p) => {
      const d = doctorById.get(String(p?.doctorId || "")) || null;
      return {
        ...p.toObject(),
        doctor: d
          ? { id: String(d._id), name: d.fullName, specialty: d.specialty, userId: d.userId }
          : null
      };
    });

    return res.status(200).json({
      total,
      page: parsedPage,
      totalPages: Math.ceil(total / parsedLimit),
      prescriptions: enriched
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch prescriptions.",
      error: error.message
    });
  }
};

// ---------------------------------------------------
// Patient: Get one of my prescriptions by id
// ---------------------------------------------------

export const getMyPatientPrescriptionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid prescription ID."
      });
    }

    const prescription = await Prescription.findOne({
      _id: id,
      patientId: req.user.id
    });

    if (!prescription) {
      return res.status(404).json({
        message: "Prescription not found."
      });
    }

    const doctor = prescription?.doctorId
      ? await Doctor.findById(prescription.doctorId).select("fullName specialty userId")
      : null;

    return res.status(200).json({
      prescription: {
        ...prescription.toObject(),
        doctor: doctor
          ? { id: String(doctor._id), name: doctor.fullName, specialty: doctor.specialty, userId: doctor.userId }
          : null
      }
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch prescription.",
      error: error.message
    });
  }
};

// ---------------------------------------------------
// Get single prescription by ID
// Only the issuing doctor can access it here
// ---------------------------------------------------

export const getPrescriptionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid prescription ID."
      });
    }

    const prescription = await Prescription.findOne({
      _id: id,
      doctorId: req.user.id
    });

    if (!prescription) {
      return res.status(404).json({
        message: "Prescription not found."
      });
    }

    return res.status(200).json({
      prescription
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch prescription.",
      error: error.message
    });
  }
};

// ---------------------------------------------------
// Get prescriptions for one patient issued by current doctor
// ---------------------------------------------------

export const getPrescriptionsByPatientId = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { page = 1, limit = 10, status = "" } = req.query;

    if (!isValidObjectId(patientId)) {
      return res.status(400).json({
        message: "Invalid patientId."
      });
    }

    const parsedPage = Math.max(Number(page) || 1, 1);
    const parsedLimit = Math.max(Number(limit) || 10, 1);
    const skip = (parsedPage - 1) * parsedLimit;

    const query = buildDoctorPrescriptionQuery(req.user.id, { patientId });

    if (status) {
      query.status = status;
    }

    const [prescriptions, total] = await Promise.all([
      Prescription.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit),
      Prescription.countDocuments(query)
    ]);

    return res.status(200).json({
      total,
      page: parsedPage,
      totalPages: Math.ceil(total / parsedLimit),
      prescriptions
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch patient prescriptions.",
      error: error.message
    });
  }
};

// ---------------------------------------------------
// Update prescription
// Only issuing doctor can update
// ---------------------------------------------------

export const updatePrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      diagnosis,
      medicines,
      notes,
      followUpDate
    } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid prescription ID."
      });
    }

    const prescription = await Prescription.findOne({
      _id: id,
      doctorId: req.user.id
    });

    if (!prescription) {
      return res.status(404).json({
        message: "Prescription not found."
      });
    }

    if (prescription.status === "cancelled") {
      return res.status(400).json({
        message: "Cancelled prescriptions cannot be updated."
      });
    }

    const updates = {};

    if (diagnosis !== undefined) {
      updates.diagnosis = diagnosis?.trim?.() || "";
    }

    if (notes !== undefined) {
      updates.notes = notes?.trim?.() || "";
    }

    if (followUpDate !== undefined) {
      updates.followUpDate = followUpDate || null;
    }

    if (medicines !== undefined) {
      const normalizedMedicines = normalizeMedicines(medicines);

      if (normalizedMedicines.length === 0) {
        return res.status(400).json({
          message: "At least one valid medicine is required."
        });
      }

      updates.medicines = normalizedMedicines;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "No valid fields provided for update."
      });
    }

    Object.assign(prescription, updates);
    await prescription.save();

    return res.status(200).json({
      message: "Prescription updated successfully.",
      prescription
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update prescription.",
      error: error.message
    });
  }
};

// ---------------------------------------------------
// Cancel prescription
// Soft-cancel using status
// ---------------------------------------------------

export const cancelPrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancelReason } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid prescription ID."
      });
    }

    const prescription = await Prescription.findOne({
      _id: id,
      doctorId: req.user.id
    });

    if (!prescription) {
      return res.status(404).json({
        message: "Prescription not found."
      });
    }

    if (prescription.status === "cancelled") {
      return res.status(400).json({
        message: "Prescription is already cancelled."
      });
    }

    prescription.status = "cancelled";
    prescription.cancelReason = cancelReason?.trim?.() || "";
    prescription.cancelledAt = new Date();

    await prescription.save();

    return res.status(200).json({
      message: "Prescription cancelled successfully.",
      prescription
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to cancel prescription.",
      error: error.message
    });
  }
};