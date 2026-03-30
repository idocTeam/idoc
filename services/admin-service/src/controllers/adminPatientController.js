import axios from "axios";

// Delete patient account
export const deletePatient = async (req, res) => {
  try {
    const { patientId } = req.params;

    // Forward request to patient-service internal endpoint
    const response = await axios.delete(
      `${process.env.PATIENT_SERVICE_URL}/api/patients/internal/admin/${patientId}`,
      {
        headers: {
          "x-internal-service-key": process.env.INTERNAL_SERVICE_SECRET
        }
      }
    );

    return res.status(200).json({
      message: "Patient deleted successfully.",
      data: response.data
    });
  } catch (error) {
    return res.status(error.response?.status || 500).json({
      message: "Failed to delete patient.",
      error: error.response?.data || error.message
    });
  }
};