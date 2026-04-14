import mongoose from "mongoose";

const telemedicineSessionSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: String,
      required: true,
      index: true
    },
    patientId: {
      type: String,
      required: true
    },
    doctorId: {
      type: String,
      required: true
    },
    appointmentDate: {
      type: String,
      required: true
    },
    startTime: {
      type: String,
      required: true
    },
    jitsiRoomId: {
      type: String,
      required: true
    },
    jitsiLink: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ["scheduled", "active", "completed", "cancelled"],
      default: "scheduled"
    },
    meetingToken: {
      type: String
    }
  },
  { timestamps: true }
);

const TelemedicineSession = mongoose.model("TelemedicineSession", telemedicineSessionSchema);
export default TelemedicineSession;
