// src/controllers/notificationController.js

import {
  createAndSendNotification,
  getAllNotificationsService,
  getNotificationByIdService,
  getNotificationsByUserIdService
} from "../services/notificationService.js";

export const sendNotification = async (req, res) => {
  try {
    const { type, recipient, channels, data } = req.body;

    if (!recipient?.email && !(channels || ["email"]).includes("in_app")) {
      return res.status(400).json({
        message: "Recipient email is required for email notifications"
      });
    }

    const notification = await createAndSendNotification({
      type,
      recipient,
      channels,
      data
    });

    return res.status(201).json({
      message: "Notification sent successfully",
      data: notification
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to send notification",
      error: error.message
    });
  }
};

export const getAllNotifications = async (req, res) => {
  try {
    const notifications = await getAllNotificationsService();

    return res.status(200).json({
      message: "Notifications fetched successfully",
      count: notifications.length,
      data: notifications
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch notifications",
      error: error.message
    });
  }
};

export const getNotificationById = async (req, res) => {
  try {
    const notification = await getNotificationByIdService(req.params.id);

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found"
      });
    }

    return res.status(200).json({
      message: "Notification fetched successfully",
      data: notification
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch notification",
      error: error.message
    });
  }
};

export const getNotificationsByUserId = async (req, res) => {
  try {
    const notifications = await getNotificationsByUserIdService(req.params.userId);

    return res.status(200).json({
      message: "User notifications fetched successfully",
      count: notifications.length,
      data: notifications
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch user notifications",
      error: error.message
    });
  }
};