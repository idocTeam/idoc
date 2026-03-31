import express from "express";
import { loginAdmin } from "../controllers/adminAuthController.js";

const router = express.Router();

// Admin login
router.post("/login", loginAdmin);

export default router;