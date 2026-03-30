import jwt from "jsonwebtoken";

// Protect admin routes using JWT
export const protectAdmin = async (req, res, next) => {
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

    // Only admin token can access
    if (decoded.role !== "admin") {
      return res.status(403).json({
        message: "Access denied. Admin token required."
      });
    }

    // Attach admin data to request
    req.user = {
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