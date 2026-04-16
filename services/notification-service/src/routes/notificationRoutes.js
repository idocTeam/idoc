// src/routes/notificationRoutes.js

import express from "express";
import {
  sendNotification,
  getAllNotifications,
  getNotificationById,
  getNotificationsByUserId
} from "../controllers/notificationController.js";

const router = express.Router();

router.post("/send", sendNotification);
router.get("/", getAllNotifications);
router.get("/user/:userId", getNotificationsByUserId);
router.get("/:id", getNotificationById);

export default router;