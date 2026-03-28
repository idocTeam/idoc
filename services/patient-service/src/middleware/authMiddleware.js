import jwt from "jsonwebtoken";
import Patient from "../models/Patient.js";

// Protect patient routes using JWT
export const protectPatient = async (req, res, next) => {
  try {
    // Read Authorization header
    const authHeader = req.headers.authorization;

    // Validate header format
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Not authorized. Token missing."
      });
    }

    // Extract token
    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Safety role check
    if (decoded.role !== "patient") {
      return res.status(403).json({
        message: "Access denied. Patient token required."
      });
    }

    // Find current patient
    const patient = await Patient.findById(decoded.id).select("-pw");

    if (!patient) {
      return res.status(401).json({
        message: "Patient not found for this token."
      });
    }

    // Attach patient info to request
    req.user = {
      id: patient._id,
      userId: patient.userId,
      email: patient.email,
      role: "patient"
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token."
    });
  }
};