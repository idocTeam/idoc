import bcrypt from "bcryptjs";
import Patient from "../models/Patient.js";
import generateToken from "../utils/generateToken.js";

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
        phone: patient.phone
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