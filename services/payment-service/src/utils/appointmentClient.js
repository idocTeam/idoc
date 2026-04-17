import axios from "axios";

const APPOINTMENT_SERVICE_URL = process.env.APPOINTMENT_SERVICE_URL || "http://localhost:5007";

export const getAppointmentById = async (id, token) => {
  try {
    const response = await axios.get(`${APPOINTMENT_SERVICE_URL}/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.appointment;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Failed to fetch appointment");
  }
};

export const updateAppointmentPaymentStatus = async (id, paymentStatus, amountPaid, token) => {
  try {
    const response = await axios.patch(
      `${APPOINTMENT_SERVICE_URL}/${id}/mark-paid`,
      { paymentStatus, amountPaid },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data.appointment;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Failed to update appointment payment status");
  }
};
