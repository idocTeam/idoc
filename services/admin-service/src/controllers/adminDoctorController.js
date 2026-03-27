import axios from "axios";

// Approve doctor registration
export const approveDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;

    // Forward request to doctor-service internal endpoint
    const response = await axios.patch(
      `${process.env.DOCTOR_SERVICE_URL}/api/doctors/internal/admin/${doctorId}/approve`,
      {},
      {
        headers: {
          "x-internal-service-key": process.env.INTERNAL_SERVICE_SECRET
        }
      }
    );

    return res.status(200).json({
      message: "Doctor approved successfully.",
      data: response.data
    });
  } catch (error) {
    return res.status(error.response?.status || 500).json({
      message: "Failed to approve doctor.",
      error: error.response?.data || error.message
    });
  }
};

// Reject doctor registration
export const rejectDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { rejectionReason } = req.body;

    // Require rejection reason for better governance
    if (!rejectionReason) {
      return res.status(400).json({
        message: "rejectionReason is required."
      });
    }

    // Forward request to doctor-service internal endpoint
    const response = await axios.patch(
      `${process.env.DOCTOR_SERVICE_URL}/api/doctors/internal/admin/${doctorId}/reject`,
      { rejectionReason },
      {
        headers: {
          "x-internal-service-key": process.env.INTERNAL_SERVICE_SECRET
        }
      }
    );

    return res.status(200).json({
      message: "Doctor rejected successfully.",
      data: response.data
    });
  } catch (error) {
    return res.status(error.response?.status || 500).json({
      message: "Failed to reject doctor.",
      error: error.response?.data || error.message
    });
  }
};

// Delete doctor account
export const deleteDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;

    // Forward request to doctor-service internal endpoint
    const response = await axios.delete(
      `${process.env.DOCTOR_SERVICE_URL}/api/doctors/internal/admin/${doctorId}`,
      {
        headers: {
          "x-internal-service-key": process.env.INTERNAL_SERVICE_SECRET
        }
      }
    );

    return res.status(200).json({
      message: "Doctor deleted successfully.",
      data: response.data
    });
  } catch (error) {
    return res.status(error.response?.status || 500).json({
      message: "Failed to delete doctor.",
      error: error.response?.data || error.message
    });
  }
};