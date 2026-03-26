import mongoose from "mongoose";

// -------------------------------------
// Medicine item sub-schema
// One prescription can contain many medicines
// -------------------------------------
const medicineSchema = new mongoose.Schema(
  {
    // Medicine name
    name: {
      type: String,
      required: true,
      trim: true
    },

    // Example: 500mg, 1 tablet, 5ml
    dosage: {
      type: String,
      trim: true,
      default: ""
    },

    // Example: twice daily, once after meals
    frequency: {
      type: String,
      trim: true,
      default: ""
    },

    // Example: 5 days, 2 weeks
    duration: {
      type: String,
      trim: true,
      default: ""
    },

    // Extra medicine instructions
    instructions: {
      type: String,
      trim: true,
      default: ""
    }
  },
  {
    _id: false // No need separate _id for each medicine item right now
  }
);

// -------------------------------------
// Prescription schema
// -------------------------------------
const prescriptionSchema = new mongoose.Schema(
  {
    // Doctor who issued the prescription
    // Stored as plain ObjectId to avoid tight microservice coupling
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },

    // Patient who receives the prescription
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },

    // Optional appointment link
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true
    },

    // Diagnosis or summary of condition
    diagnosis: {
      type: String,
      trim: true,
      default: ""
    },

    // Medicines list
    medicines: {
      type: [medicineSchema],
      required: true,
      validate: {
        validator: function (value) {
          return Array.isArray(value) && value.length > 0;
        },
        message: "At least one medicine is required."
      }
    },

    // General doctor notes
    notes: {
      type: String,
      trim: true,
      default: ""
    },

    // Optional follow-up date
    followUpDate: {
      type: Date,
      default: null
    },

    // Prescription status
    status: {
      type: String,
      enum: ["active", "cancelled"],
      default: "active",
      index: true
    },

    // Optional cancel reason
    cancelReason: {
      type: String,
      trim: true,
      default: ""
    },

    // When prescription was cancelled
    cancelledAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// -------------------------------------
// Helpful compound indexes
// -------------------------------------
prescriptionSchema.index({ doctorId: 1, createdAt: -1 });
prescriptionSchema.index({ doctorId: 1, patientId: 1, createdAt: -1 });
prescriptionSchema.index({ doctorId: 1, appointmentId: 1 });

// -------------------------------------
// Export model
// -------------------------------------
const Prescription = mongoose.model("Prescription", prescriptionSchema);

export default Prescription;