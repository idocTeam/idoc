import bcrypt from "bcryptjs";
import Doctor from "../models/Doctor.js";
import generateToken from "../utils/generateToken.js";

// Register doctor
export const registerDoctor = async (req, res) => {
  try {
    const {
      email,
      pw,
      fullName,
      phone,
      specialty,
      qualifications,
      hospital,
      consultationFee,
      bio,
      experienceYears,
      medicalLicenseNumber
    } = req.body;

    // Basic required field validation
    if (
      !email ||
      !pw ||
      !fullName ||
      !phone ||
      !specialty ||
      !qualifications ||
      !hospital ||
      consultationFee === undefined ||
      !bio ||
      experienceYears === undefined ||
      !medicalLicenseNumber
    ) {
      return res.status(400).json({
        message: "Please provide all required doctor fields."
      });
    }

    // Check email duplicate
    const existingEmail = await Doctor.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({
        message: "Doctor email already exists."
      });
    }

    // Check license duplicate
    const existingLicense = await Doctor.findOne({ medicalLicenseNumber });
    if (existingLicense) {
      return res.status(409).json({
        message: "Medical license number already exists."
      });
    }

    // Hash password
    const hashedPw = await bcrypt.hash(pw, 10);

    // Create doctor WITHOUT availability
    const doctor = await Doctor.create({
      email,
      pw: hashedPw,
      fullName,
      phone,
      specialty,
      qualifications,
      hospital,
      consultationFee,
      bio,
      experienceYears,
      medicalLicenseNumber
    });

    return res.status(201).json({
      message:
        "Doctor registered successfully. Waiting for admin approval. Add availability after login.",
      doctor: {
        id: doctor._id,
        userId: doctor.userId,
        email: doctor.email,
        fullName: doctor.fullName,
        specialty: doctor.specialty,
        hospital: doctor.hospital,
        approvalStatus: doctor.approvalStatus,
        createdAt: doctor.createdAt
      }
    });
  } catch (error) {
    return res.status(500).json({
      message: "Doctor registration failed.",
      error: error.message
    });
  }
};

// Login doctor
export const loginDoctor = async (req, res) => {
  try {
    const { email, pw } = req.body;

    if (!email || !pw) {
      return res.status(400).json({
        message: "Email and password are required."
      });
    }

    const doctor = await Doctor.findOne({ email }).select("+pw");

    if (!doctor) {
      return res.status(401).json({
        message: "Invalid email or password."
      });
    }

    const isMatch = await bcrypt.compare(pw, doctor.pw);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password."
      });
    }

    if (doctor.approvalStatus === "pending") {
      return res.status(403).json({
        message: "Your account is still pending admin approval."
      });
    }

    if (doctor.approvalStatus === "rejected") {
      return res.status(403).json({
        message: "Your account was rejected by admin.",
        rejectionReason: doctor.rejectionReason || "No reason provided."
      });
    }

    const token = generateToken({
      id: doctor._id,
      userId: doctor.userId,
      email: doctor.email,
      role: "doctor"
    });

    return res.status(200).json({
      message: "Doctor login successful.",
      token,
      doctor: {
        id: doctor._id,
        userId: doctor.userId,
        email: doctor.email,
        fullName: doctor.fullName,
        specialty: doctor.specialty,
        hospital: doctor.hospital,
        approvalStatus: doctor.approvalStatus
      }
    });
  } catch (error) {
    return res.status(500).json({
      message: "Doctor login failed.",
      error: error.message
    });
  }
};

// Get currently logged-in doctor profile
export const getMyDoctorProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.user.id).select("-pw");

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