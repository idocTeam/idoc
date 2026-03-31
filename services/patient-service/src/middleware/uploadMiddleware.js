import multer from "multer";
import fs from "fs";
import path from "path";
import crypto from "crypto";

// Create uploads/reports folder automatically if it does not exist
const uploadDir = path.join("uploads", "reports");
fs.mkdirSync(uploadDir, { recursive: true });

// Configure file storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },

  filename: (_req, file, cb) => {
    // Clean original file name a bit
    const safeOriginalName = file.originalname
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9._-]/g, "");

    cb(null, `${Date.now()}-${crypto.randomUUID()}-${safeOriginalName}`);
  }
});

// Allow PDF files only
const fileFilter = (_req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed."), false);
  }
};

// Export multer upload middleware
export const uploadReportPdf = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB
  }
});