import generateToken from "../utils/generateToken.js";

// Fixed admin login from .env
export const loginAdmin = async (req, res) => {
  try {
    const { email, pw } = req.body;

    // Validate input
    if (!email || !pw) {
      return res.status(400).json({
        message: "Email and password are required."
      });
    }

    // Compare with fixed admin credentials
    if (
      email !== process.env.ADMIN_EMAIL ||
      pw !== process.env.ADMIN_PASSWORD
    ) {
      return res.status(401).json({
        message: "Invalid admin credentials."
      });
    }

    // Generate JWT
    const token = generateToken({
      email: process.env.ADMIN_EMAIL,
      role: "admin"
    });

    return res.status(200).json({
      message: "Admin login successful.",
      token,
      admin: {
        email: process.env.ADMIN_EMAIL,
        role: "admin"
      }
    });
  } catch (error) {
    return res.status(500).json({
      message: "Admin login failed.",
      error: error.message
    });
  }
};