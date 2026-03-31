// src/middlewares/authMiddleware.js

import jwt from "jsonwebtoken";

/**
 * Generic helper to read Bearer token
 */
const getTokenFromHeader = (req) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.split(" ")[1];
};

/**
 * Optional generic authenticated user
 * Tries patient secret first, then doctor secret.
 * Use only if you really need a shared guard.
 */
export const protectUser = async (req, res, next) => {
  try {
    const token = getTokenFromHeader(req);

    if (!token) {
      return res.status(401).json({
        message: "Not authorized. Token missing."
      });
    }

    let decoded = null;

    try {
      decoded = jwt.verify(token, process.env.PATIENT_JWT_SECRET);
    } catch {
      decoded = jwt.verify(token, process.env.DOCTOR_JWT_SECRET);
    }

    req.user = {
      id: decoded.id,
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token."
    });
  }
};

/**
 * Patient only
 */
export const protectPatient = async (req, res, next) => {
  try {
    const token = getTokenFromHeader(req);

    if (!token) {
      return res.status(401).json({
        message: "Not authorized. Token missing."
      });
    }

    const decoded = jwt.verify(token, process.env.PATIENT_JWT_SECRET);

    if (decoded.role !== "patient") {
      return res.status(403).json({
        message: "Access denied. Patient token required."
      });
    }

    req.user = {
      id: decoded.id,
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    console.error("protectPatient JWT error:", error.message);

    return res.status(401).json({
      message: "Invalid or expired patient token."
    });
  }
};

/**
 * Doctor only
 */
export const protectDoctor = async (req, res, next) => {
  try {
    const token = getTokenFromHeader(req);

    if (!token) {
      return res.status(401).json({
        message: "Not authorized. Token missing."
      });
    }

    const decoded = jwt.verify(token, process.env.DOCTOR_JWT_SECRET);

    if (decoded.role !== "doctor") {
      return res.status(403).json({
        message: "Access denied. Doctor token required."
      });
    }

    req.user = {
      id: decoded.id,
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    console.error("protectDoctor JWT error:", error.message);

    return res.status(401).json({
      message: "Invalid or expired doctor token."
    });
  }
};