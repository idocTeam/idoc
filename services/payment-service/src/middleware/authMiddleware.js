import jwt from "jsonwebtoken";

const getTokenFromHeader = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.split(" ")[1];
};

export const protectUser = async (req, res, next) => {
  try {
    const token = getTokenFromHeader(req);
    if (!token) {
      return res.status(401).json({ message: "Not authorized. Token missing." });
    }

    let decoded = null;
    // We try to verify with both patient and doctor secrets as in the original project
    try {
      decoded = jwt.verify(token, process.env.PATIENT_JWT_SECRET || "patient_secret");
    } catch {
      try {
        decoded = jwt.verify(token, process.env.DOCTOR_JWT_SECRET || "doctor_secret");
      } catch {
        decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET || "admin_secret");
      }
    }

    req.user = {
      id: decoded.id || decoded.userId,
      role: decoded.role
    };
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};
