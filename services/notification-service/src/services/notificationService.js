// src/services/notificationService.js

import Notification from "../models/Notification.js";
import { sendEmail } from "./emailService.js";
import { buildTemplateByType } from "./templateService.js";

export const createAndSendNotification = async ({
  type = "GENERIC",
  recipient = {},
  channels = ["email"],
  data = {}
}) => {
  const { subject, text, html } = buildTemplateByType(type, data);

  const notification = await Notification.create({
    type,
    recipient,
    channels,
    subject,
    message: text,
    html,
    payload: data,
    status: "pending"
  });

  try {
    if (channels.includes("email")) {
      await sendEmail({
        to: recipient.email,
        subject,
        text,
        html
      });
    }

    notification.status = "sent";
    notification.sentAt = new Date();
    await notification.save();

    return notification;
  } catch (error) {
    notification.status = "failed";
    notification.errorMessage = error.message;
    await notification.save();
    throw error;
  }
};

export const getAllNotificationsService = async () => {
  return Notification.find().sort({ createdAt: -1 });
};

export const getNotificationByIdService = async (id) => {
  return Notification.findById(id);
};

export const getNotificationsByUserIdService = async (userId) => {
  return Notification.find({ "recipient.userId": userId }).sort({ createdAt: -1 });
};