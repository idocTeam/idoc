import jwt from "jsonwebtoken";
import Doctor from "../models/Doctor.js";

// Protect doctor routes using JWT
export const protectDoctor = async (req, res, next) => {
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

    // Optional safety check for role
    if (decoded.role !== "doctor") {
      return res.status(403).json({
        message: "Access denied. Doctor token required."
      });
    }

    // Find current doctor
    const doctor = await Doctor.findById(decoded.id).select("-pw");

    if (!doctor) {
      return res.status(401).json({
        message: "Doctor not found for this token."
      });
    }

    // Attach doctor info to request
    req.user = {
      id: doctor._id,
      userId: doctor.userId,
      email: doctor.email,
      role: "doctor"
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token."
    });
  }
};