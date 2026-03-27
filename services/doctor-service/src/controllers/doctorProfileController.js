import Doctor from "../models/Doctor.js";

// Small helper to safely build regex search
const escapeRegex = (value = "") => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// Public-safe fields for patient-facing responses
const PUBLIC_DOCTOR_FIELDS =
  "fullName specialty qualifications hospital consultationFee bio experienceYears availability createdAt updatedAt";

// Internal fields for doctor/internal-service use
const INTERNAL_DOCTOR_FIELDS =
  "-pw";

// Common query builder for approved + active doctors
const buildApprovedDoctorQuery = () => {
  const query = { approvalStatus: "approved" };

  // Only apply isActive filter if your schema has that field
  if (Doctor.schema.path("isActive")) {
    query.isActive = true;
  }

  return query;
};

// Doctor views own full profile
export const getMyDoctorProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.user.id).select(INTERNAL_DOCTOR_FIELDS);

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found."
      });
    }

    return res.status(200).json({
      doctor
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch doctor profile.",
      error: error.message
    });
  }
};

// Doctor updates own profile
export const updateMyDoctorProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.user.id).select(INTERNAL_DOCTOR_FIELDS);

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found."
      });
    }

    // Fields doctor is allowed to update
    const allowedFields = [
      "fullName",
      "phone",
      "specialty",
      "qualifications",
      "hospital",
      "consultationFee",
      "bio",
      "experienceYears"
      
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "No valid fields provided for update."
      });
    }

    

    Object.assign(doctor, updates);
    await doctor.save();

    return res.status(200).json({
      message: "Doctor profile updated successfully.",
      doctor
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update doctor profile.",
      error: error.message
    });
  }
};

// Doctor deletes own account
// Prefer soft delete if your schema has isActive / deletedAt
export const deleteMyDoctorAccount = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.user.id);

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found."
      });
    }

    const hasIsActive = !!Doctor.schema.path("isActive");
    const hasDeletedAt = !!Doctor.schema.path("deletedAt");

    // Soft delete if supported by schema
    if (hasIsActive || hasDeletedAt) {
      if (hasIsActive) {
        doctor.isActive = false;
      }

      if (hasDeletedAt) {
        doctor.deletedAt = new Date();
      }

      await doctor.save();

      return res.status(200).json({
        message: "Doctor account deactivated successfully."
      });
    }

    // Fallback hard delete if schema has no soft-delete fields
    await Doctor.findByIdAndDelete(req.user.id);

    return res.status(200).json({
      message: "Doctor account deleted successfully."
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete doctor account.",
      error: error.message
    });
  }
};

// Internal detailed doctor lookup by ID
export const getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await Doctor.findById(id).select(INTERNAL_DOCTOR_FIELDS);

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found."
      });
    }

    return res.status(200).json({
      doctor
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch doctor by ID.",
      error: error.message
    });
  }
};

// Public/internal list of all approved doctors
export const getAllApprovedDoctors = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const query = buildApprovedDoctorQuery();

    const [doctors, total] = await Promise.all([
      Doctor.find(query)
        .select(PUBLIC_DOCTOR_FIELDS)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Doctor.countDocuments(query)
    ]);

    return res.status(200).json({
      total,
      page,
      totalPages: Math.ceil(total / limit),
      doctors
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch approved doctors.",
      error: error.message
    });
  }
};

// Broad search across name, specialty, hospital, qualifications, bio
export const searchApprovedDoctors = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    if (!q) {
      return res.status(400).json({
        message: "Search query 'q' is required."
      });
    }

    const safeQuery = escapeRegex(q);

    const query = {
      ...buildApprovedDoctorQuery(),
      $or: [
        { fullName: { $regex: safeQuery, $options: "i" } },
        { specialty: { $regex: safeQuery, $options: "i" } },
        { hospital: { $regex: safeQuery, $options: "i" } },
        { qualifications: { $regex: safeQuery, $options: "i" } },
        { bio: { $regex: safeQuery, $options: "i" } }
      ]
    };

    const [doctors, total] = await Promise.all([
      Doctor.find(query)
        .select(PUBLIC_DOCTOR_FIELDS)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Doctor.countDocuments(query)
    ]);

    return res.status(200).json({
      total,
      page,
      totalPages: Math.ceil(total / limit),
      doctors
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to search approved doctors.",
      error: error.message
    });
  }
};

// Search only by specialty
export const searchDoctorsBySpecialty = async (req, res) => {
  try {
    const specialty = (req.query.specialty || req.params.specialty || "").trim();
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    if (!specialty) {
      return res.status(400).json({
        message: "Specialty is required."
      });
    }

    const query = {
      ...buildApprovedDoctorQuery(),
      specialty: { $regex: escapeRegex(specialty), $options: "i" }
    };

    const [doctors, total] = await Promise.all([
      Doctor.find(query)
        .select(PUBLIC_DOCTOR_FIELDS)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Doctor.countDocuments(query)
    ]);

    return res.status(200).json({
      total,
      page,
      totalPages: Math.ceil(total / limit),
      doctors
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to search doctors by specialty.",
      error: error.message
    });
  }
};

// Search only by hospital
export const searchDoctorsByHospital = async (req, res) => {
  try {
    const hospital = (req.query.hospital || req.params.hospital || "").trim();
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    if (!hospital) {
      return res.status(400).json({
        message: "Hospital is required."
      });
    }

    const query = {
      ...buildApprovedDoctorQuery(),
      hospital: { $regex: escapeRegex(hospital), $options: "i" }
    };

    const [doctors, total] = await Promise.all([
      Doctor.find(query)
        .select(PUBLIC_DOCTOR_FIELDS)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Doctor.countDocuments(query)
    ]);

    return res.status(200).json({
      total,
      page,
      totalPages: Math.ceil(total / limit),
      doctors
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to search doctors by hospital.",
      error: error.message
    });
  }
};

// Public-safe single doctor profile
export const getDoctorPublicProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const query = {
      _id: id,
      ...buildApprovedDoctorQuery()
    };

    const doctor = await Doctor.findOne(query).select(PUBLIC_DOCTOR_FIELDS);

    if (!doctor) {
      return res.status(404).json({
        message: "Approved doctor not found."
      });
    }

    return res.status(200).json({
      doctor
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch doctor public profile.",
      error: error.message
    });
  }
};


//for admin purpos

// Internal admin-facing fields
const ADMIN_DOCTOR_FIELDS = "-pw";

// Get all pending doctors for admin review
export const getPendingDoctorsForAdmin = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const query = { approvalStatus: "pending" };

    // If schema supports soft delete, avoid deleted doctors
    if (Doctor.schema.path("isActive")) {
      query.isActive = { $ne: false };
    }

    const [doctors, total] = await Promise.all([
      Doctor.find(query)
        .select(ADMIN_DOCTOR_FIELDS)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Doctor.countDocuments(query)
    ]);

    return res.status(200).json({
      total,
      page,
      totalPages: Math.ceil(total / limit),
      doctors
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch pending doctors.",
      error: error.message
    });
  }
};

// Get all approved doctors for admin view
export const getApprovedDoctorsForAdmin = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const query = { approvalStatus: "approved" };

    if (Doctor.schema.path("isActive")) {
      query.isActive = { $ne: false };
    }

    const [doctors, total] = await Promise.all([
      Doctor.find(query)
        .select(ADMIN_DOCTOR_FIELDS)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Doctor.countDocuments(query)
    ]);

    return res.status(200).json({
      total,
      page,
      totalPages: Math.ceil(total / limit),
      doctors
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch approved doctors for admin.",
      error: error.message
    });
  }
};


// Admin approves a doctor
export const approveDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await Doctor.findById(id).select(INTERNAL_DOCTOR_FIELDS);

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found."
      });
    }

    // Optional soft-delete protection
    if (Doctor.schema.path("isActive") && doctor.isActive === false) {
      return res.status(400).json({
        message: "Cannot approve an inactive doctor."
      });
    }

    doctor.approvalStatus = "approved";

    // Clear rejection reason if schema supports it
    if (Doctor.schema.path("rejectionReason")) {
      doctor.rejectionReason = "";
    }

    await doctor.save();

    return res.status(200).json({
      message: "Doctor approved successfully.",
      doctor
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to approve doctor.",
      error: error.message
    });
  }
};

// Admin rejects a doctor
export const rejectDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    const doctor = await Doctor.findById(id).select(INTERNAL_DOCTOR_FIELDS);

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found."
      });
    }

    if (Doctor.schema.path("isActive") && doctor.isActive === false) {
      return res.status(400).json({
        message: "Cannot reject an inactive doctor."
      });
    }

    doctor.approvalStatus = "rejected";

    if (Doctor.schema.path("rejectionReason")) {
      doctor.rejectionReason = rejectionReason?.trim?.() || "Rejected by admin";
    }

    await doctor.save();

    return res.status(200).json({
      message: "Doctor rejected successfully.",
      doctor
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to reject doctor.",
      error: error.message
    });
  }
};

// Admin deletes a doctor
export const deleteDoctorByAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await Doctor.findById(id);

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found."
      });
    }

    const hasIsActive = !!Doctor.schema.path("isActive");
    const hasDeletedAt = !!Doctor.schema.path("deletedAt");

    // Prefer soft delete if schema supports it
    if (hasIsActive || hasDeletedAt) {
      if (hasIsActive) {
        doctor.isActive = false;
      }

      if (hasDeletedAt) {
        doctor.deletedAt = new Date();
      }

      await doctor.save();

      return res.status(200).json({
        message: "Doctor deleted successfully (soft delete)."
      });
    }

    await Doctor.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Doctor deleted successfully."
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete doctor.",
      error: error.message
    });
  }
};