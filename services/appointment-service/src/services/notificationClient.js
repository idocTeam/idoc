// src/services/notificationClient.js

import axios from "axios";

/**
 * Send notification request to notification-service
 */
export const sendNotification = async ({ type, recipient, data }) => {
  const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL;

  if (!NOTIFICATION_SERVICE_URL) {
    console.error("NOTIFICATION_SERVICE_URL not configured");
    return;
  }

  try {
    const url = `${NOTIFICATION_SERVICE_URL}/api/notifications/send`;

    console.log("Calling notification-service:", url);

    await axios.post(url, {
      type,
      recipient,
      data,
      channels: ["email"]
    });

    console.log(`Notification of type ${type} sent to ${recipient.email}`);
  } catch (err) {
    console.error("notificationClient error:", err.response?.data || err.message);
  }
};
