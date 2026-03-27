import axios from "axios";

// Get all pending doctors
export const getPendingDoctors = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const response = await axios.get(
      `${process.env.DOCTOR_SERVICE_URL}/api/doctors/profile/admin/pending`,
      {
        params: { page, limit }
      }
    );

    return res.status(200).json({
      message: "Pending doctors fetched successfully.",
      data: response.data
    });
  } catch (error) {
    return res.status(error.response?.status || 500).json({
      message: "Failed to fetch pending doctors.",
      error: error.response?.data || error.message
    });
  }
};

// Get all approved doctors
export const getApprovedDoctors = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const response = await axios.get(
      `${process.env.DOCTOR_SERVICE_URL}/api/doctors/profile/admin/approved`,
      {
        params: { page, limit }
      }
    );

    return res.status(200).json({
      message: "Approved doctors fetched successfully.",
      data: response.data
    });
  } catch (error) {
    return res.status(error.response?.status || 500).json({
      message: "Failed to fetch approved doctors.",
      error: error.response?.data || error.message
    });
  }
};

// Approve doctor registration
export const approveDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const response = await axios.patch(
      `${process.env.DOCTOR_SERVICE_URL}/api/doctors/profile/admin/${doctorId}/approve`
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

    if (!rejectionReason) {
      return res.status(400).json({
        message: "rejectionReason is required."
      });
    }

    const response = await axios.patch(
      `${process.env.DOCTOR_SERVICE_URL}/api/doctors/profile/admin/${doctorId}/reject`,
      { rejectionReason }
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

    const response = await axios.delete(
      `${process.env.DOCTOR_SERVICE_URL}/api/doctors/profile/admin/${doctorId}`
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