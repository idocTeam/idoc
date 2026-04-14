import mongoose from "mongoose";

const eTicketSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: String,
      required: true,
      unique: true
    },
    patientId: {
      type: String,
      required: true
    },
    doctorId: {
      type: String,
      required: true
    },
    patientName: {
      type: String,
      required: true
    },
    doctorName: {
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
    jitsiLink: {
      type: String
    },
    amountPaid: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: "usd"
    },
    ticketNumber: {
      type: String,
      required: true,
      unique: true
    }
  },
  { timestamps: true }
);

const ETicket = mongoose.model("ETicket", eTicketSchema);
export default ETicket;
