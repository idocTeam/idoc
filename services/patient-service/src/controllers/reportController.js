import fs from "fs";
import Patient from "../models/Patient.js";
import PatientReport from "../models/PatientReport.js";

// Small helper to delete physical files safely
const deleteFileIfExists = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error("File delete failed:", error.message);
  }
};

// Build full file URL for browser download/view
const buildFileUrl = (req, filePath) => {
  const normalizedPath = filePath.replace(/\\/g, "/");
  return `${req.protocol}://${req.get("host")}/${normalizedPath}`;
};

// Create new report (patient uploads PDF)
export const createReport = async (req, res) => {
  try {
    const { reportType } = req.body;

    // Validate business fields
    if (!reportType) {
      return res.status(400).json({
        message: "reportType is required."
      });
    }

    // Validate uploaded file
    if (!req.file) {
      return res.status(400).json({
        message: "PDF report file is required."
      });
    }

    // Ensure current patient exists
    const patient = await Patient.findById(req.user.id).select("userId fullName");
    if (!patient) {
      return res.status(404).json({
        message: "Patient not found."
      });
    }

    // Create report record
    const report = await PatientReport.create({
      reportType,
      patientId: patient.userId,
      fileName: req.file.filename,
      filePath: req.file.path,
      fileUrl: buildFileUrl(req, req.file.path),
      mimeType: req.file.mimetype,
      fileSize: req.file.size
    });

    return res.status(201).json({
      message: "Patient report uploaded successfully.",
      report
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to upload patient report.",
      error: error.message
    });
  }
};

// Get all reports of logged-in patient
export const getMyReports = async (req, res) => {
  try {
    const reports = await PatientReport.find({
      patientId: req.user.userId
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      count: reports.length,
      reports
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch patient reports.",
      error: error.message
    });
  }
};

// Get one report of logged-in patient by reportId
export const getMyReportById = async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await PatientReport.findOne({
      reportId,
      patientId: req.user.userId
    });

    if (!report) {
      return res.status(404).json({
        message: "Report not found."
      });
    }

    return res.status(200).json({
      report
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch report.",
      error: error.message
    });
  }
};

// Update report metadata and optionally replace PDF
export const updateMyReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { reportType } = req.body;

    const report = await PatientReport.findOne({
      reportId,
      patientId: req.user.userId
    });

    if (!report) {
      // Remove uploaded replacement file if report not found
      if (req.file) {
        deleteFileIfExists(req.file.path);
      }

      return res.status(404).json({
        message: "Report not found."
      });
    }

    // Update report type if provided
    if (reportType !== undefined) {
      report.reportType = reportType;
    }

    // Replace PDF if new file uploaded
    if (req.file) {
      // Delete old physical file first
      deleteFileIfExists(report.filePath);

      report.fileName = req.file.filename;
      report.filePath = req.file.path;
      report.fileUrl = buildFileUrl(req, req.file.path);
      report.mimeType = req.file.mimetype;
      report.fileSize = req.file.size;
    }

    await report.save();

    return res.status(200).json({
      message: "Patient report updated successfully.",
      report
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update patient report.",
      error: error.message
    });
  }
};

// Delete one report of logged-in patient
export const deleteMyReport = async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await PatientReport.findOne({
      reportId,
      patientId: req.user.userId
    });

    if (!report) {
      return res.status(404).json({
        message: "Report not found."
      });
    }

    // Delete physical PDF file
    deleteFileIfExists(report.filePath);

    // Delete MongoDB document
    await report.deleteOne();

    return res.status(200).json({
      message: "Patient report deleted successfully."
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete patient report.",
      error: error.message
    });
  }
};

// Doctor/Admin can see all reports by patientId (PAT-...)
export const getReportsByPatientId = async (req, res) => {
  try {
    const { patientId } = req.params;

    // Verify patient exists
    const patient = await Patient.findOne({ userId: patientId }).select(
      "userId fullName email phone"
    );

    if (!patient) {
      return res.status(404).json({
        message: "Patient not found."
      });
    }

    const reports = await PatientReport.find({ patientId }).sort({
      createdAt: -1
    });

    return res.status(200).json({
      patient,
      count: reports.length,
      reports
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch reports by patient ID.",
      error: error.message
    });
  }
};

// Doctor/Admin can see one specific report by patientId + reportId
export const getReportByPatientIdAndReportId = async (req, res) => {
  try {
    const { patientId, reportId } = req.params;

    const report = await PatientReport.findOne({
      patientId,
      reportId
    });

    if (!report) {
      return res.status(404).json({
        message: "Report not found."
      });
    }

    return res.status(200).json({
      report
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch report.",
      error: error.message
    });
  }
};