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
      "experienceYears",
      "availability"
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

    // Prevent accidental invalid availability type
    if (
      updates.availability !== undefined &&
      !Array.isArray(updates.availability)
    ) {
      return res.status(400).json({
        message: "Availability must be an array."
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