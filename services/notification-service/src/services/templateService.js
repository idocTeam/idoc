// src/services/templateService.js

import appointmentBookedTemplate from "../templates/appointmentBooked.js";
import appointmentAcceptedTemplate from "../templates/appointmentAccepted.js";
import appointmentRejectedTemplate from "../templates/appointmentRejected.js";
import appointmentCancelledTemplate from "../templates/appointmentCancelled.js";
import reminderTemplate from "../templates/reminder.js";

export const buildTemplateByType = (type, data = {}) => {
  switch (type) {
    case "APPOINTMENT_BOOKED":
      return appointmentBookedTemplate(data);

    case "APPOINTMENT_ACCEPTED":
      return appointmentAcceptedTemplate(data);

    case "APPOINTMENT_REJECTED":
      return appointmentRejectedTemplate(data);

    case "APPOINTMENT_CANCELLED":
      return appointmentCancelledTemplate(data);

    case "APPOINTMENT_REMINDER":
      return reminderTemplate(data);

    case "GENERIC":
    default:
      return {
        subject: data.subject || "Notification",
        text: data.message || "You have a new notification.",
        html: `<p>${data.message || "You have a new notification."}</p>`
      };
  }
};