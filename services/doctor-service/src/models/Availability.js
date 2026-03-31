import mongoose from "mongoose";

const slotSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ],
      default: ""
    },
    date: {
      type: String,
      default: ""
    },
    startTime: {
      type: String,
      required: true,
      trim: true
    },
    endTime: {
      type: String,
      required: true,
      trim: true
    },
    mode: {
      type: String,
      enum: ["online", "physical", "both"],
      default: "online"
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    slotDurationMinutes: {
      type: Number,
      required: true,
      default: 20,
      enum: [10, 15, 20, 30, 45, 60]
    }
  },
  { timestamps: true }
);

const availabilitySchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      unique: true
    },
    slots: {
      type: [slotSchema],
      default: []
    }
  },
  { timestamps: true }
);

const Availability = mongoose.model("Availability", availabilitySchema);

export default Availability;