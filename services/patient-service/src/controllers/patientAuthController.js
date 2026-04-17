import bcrypt from "bcryptjs";
import Patient from "../models/Patient.js";
import generateToken from "../utils/generateToken.js";
import fs from "fs";
import path from "path";

// Register patient
export const registerPatient = async (req, res) => {
  try {
    const {
      email,
      pw,
      fullName,
      phone,
      dateOfBirth,
      gender,
      address
    } = req.body;

    // Validate required fields
    if (!email || !pw || !fullName || !phone) {
      return res.status(400).json({
        message: "Please provide email, password, fullName, and phone."
      });
    }

    // Check email duplicate
    const existingPatient = await Patient.findOne({ email });
    if (existingPatient) {
      return res.status(409).json({
        message: "Patient email already exists."
      });
    }

    // Hash password
    const hashedPw = await bcrypt.hash(pw, 10);

    // Create patient
    const patient = await Patient.create({
      email,
      pw: hashedPw,
      fullName,
      phone,
      dateOfBirth,
      gender,
      address
    });

    return res.status(201).json({
      message: "Patient registered successfully.",
      patient: {
        id: patient._id,
        userId: patient.userId,
        email: patient.email,
        fullName: patient.fullName,
        phone: patient.phone,
        gender: patient.gender,
        address: patient.address,
        photoPath: patient.photoPath,
        dateOfBirth: patient.dateOfBirth,
        createdAt: patient.createdAt
      }
    });
  } catch (error) {
    return res.status(500).json({
      message: "Patient registration failed.",
      error: error.message
    });
  }
};

// Login patient
export const loginPatient = async (req, res) => {
  try {
    const { email, pw } = req.body;

    // Validate input
    if (!email || !pw) {
      return res.status(400).json({
        message: "Email and password are required."
      });
    }

    // Find patient with password
    const patient = await Patient.findOne({ email }).select("+pw");

    if (!patient) {
      return res.status(401).json({
        message: "Invalid email or password."
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(pw, patient.pw);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password."
      });
    }

    // Generate JWT
    const token = generateToken({
      id: patient._id,
      userId: patient.userId,
      email: patient.email,
      role: "patient"
    });

    return res.status(200).json({
      message: "Patient login successful.",
      token,
      patient: {
        id: patient._id,
        userId: patient.userId,
        email: patient.email,
        fullName: patient.fullName,
        phone: patient.phone,
        photoPath: patient.photoPath
      }
    });
  } catch (error) {
    return res.status(500).json({
      message: "Patient login failed.",
      error: error.message
    });
  }
};

// Get currently logged-in patient profile
export const getMyPatientProfile = async (req, res) => {
  try {
    const patient = await Patient.findById(req.user.id).select("-pw");

    if (!patient) {
      return res.status(404).json({
        message: "Patient not found."
      });
    }

    return res.status(200).json({
      patient
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch patient profile.",
      error: error.message
    });
  }
};

// Update currently logged-in patient profile
export const updateMyPatientProfile = async (req, res) => {
  try {
    const {
      email,
      pw,
      fullName,
      phone,
      dateOfBirth,
      gender,
      address
    } = req.body;

    // Get current patient including password only if needed for update
    const patient = await Patient.findById(req.user.id).select("+pw");

    if (!patient) {
      return res.status(404).json({
        message: "Patient not found."
      });
    }

    // If email is being changed, check duplicate
    if (email && email !== patient.email) {
      const existingPatient = await Patient.findOne({ email });

      if (existingPatient) {
        return res.status(409).json({
          message: "Email is already in use by another patient."
        });
      }

      patient.email = email;
    }

    // Update only provided fields
    if (fullName !== undefined) patient.fullName = fullName;
    if (phone !== undefined) patient.phone = phone;
    if (dateOfBirth !== undefined) patient.dateOfBirth = dateOfBirth || null;
    if (gender !== undefined) patient.gender = gender;
    if (address !== undefined) patient.address = address;

    // Hash new password only if provided
    if (pw) {
      patient.pw = await bcrypt.hash(pw, 10);
    }

    const updatedPatient = await patient.save();

    // Regenerate token in case email changed
    const token = generateToken({
      id: updatedPatient._id,
      userId: updatedPatient.userId,
      email: updatedPatient.email,
      role: "patient"
    });

    return res.status(200).json({
      message: "Patient profile updated successfully.",
      token,
      patient: {
        id: updatedPatient._id,
        userId: updatedPatient.userId,
        email: updatedPatient.email,
        fullName: updatedPatient.fullName,
        phone: updatedPatient.phone,
        dateOfBirth: updatedPatient.dateOfBirth,
        gender: updatedPatient.gender,
        address: updatedPatient.address,
        photoPath: updatedPatient.photoPath,
        updatedAt: updatedPatient.updatedAt
      }
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update patient profile.",
      error: error.message
    });
  }
};

// Upload currently logged-in patient profile photo
export const uploadMyPatientPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Photo file is required." });
    }

    const patient = await Patient.findById(req.user.id).select("-pw");
    if (!patient) {
      return res.status(404).json({ message: "Patient not found." });
    }

    const oldPath = patient.photoPath ? String(patient.photoPath) : "";
    if (oldPath.startsWith("/uploads/")) {
      const diskPath = path.join("uploads", oldPath.replace(/^\/uploads\//, ""));
      fs.promises.unlink(diskPath).catch(() => {});
    }

    patient.photoPath = `/uploads/patients/${req.file.filename}`;
    await patient.save();

    return res.status(200).json({
      message: "Patient photo uploaded successfully.",
      patient
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to upload patient photo.",
      error: error.message
    });
  }
};

// Delete currently logged-in patient profile
export const deleteMyPatientProfile = async (req, res) => {
  try {
    const patient = await Patient.findById(req.user.id);

    if (!patient) {
      return res.status(404).json({
        message: "Patient not found."
      });
    }

    await Patient.findByIdAndDelete(req.user.id);

    return res.status(200).json({
      message: "Patient profile deleted successfully."
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete patient profile.",
      error: error.message
    });
  }
};

// Get patient by ID (supports MongoDB _id and custom userId)
export const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    let patient;

    // Check if it's a valid MongoDB ObjectId
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      patient = await Patient.findById(id).select("-pw");
    }

    // If not found by _id, try custom userId (PAT-...)
    if (!patient) {
      patient = await Patient.findOne({ userId: id }).select("-pw");
    }

    if (!patient) {
      return res.status(404).json({
        message: "Patient not found."
      });
    }

    return res.status(200).json({
      patient
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch patient profile.",
      error: error.message
    });
  }
};

// Admin delete patient
export const deletePatientByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await Patient.findByIdAndDelete(id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    return res.status(200).json({ message: "Patient account deleted by admin" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete patient account", error: error.message });
  }
};