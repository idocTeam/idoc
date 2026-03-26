import mongoose from "mongoose";
import crypto from "crypto";

// Availability sub-schema
const availabilitySchema = new mongoose.Schema(
    {
        day: {
            type: String,
            required: true,
            enum: [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday"
            ]
        },
        startTime: {
            type: String,
            required: true
        },
        endTime: {
            type: String,
            required: true
        }
    },
    { _id: false }
);

// Main doctor schema
const doctorSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        // Using pw because you asked for email,pw
        pw: {
            type: String,
            required: true,
            select: false
        },

        userId: {
            type: String,
            required: true,
            unique: true,
            default: () => `DOC-${crypto.randomUUID()}`
        },

        fullName: {
            type: String,
            required: true
        },

        phone: {
            type: String,
            required: true
        },

        specialty: {
            type: String,
            required: true
        },

        qualifications: {
            type: String,
            required: true
        },

        hospital: {
            type: String,
            required: true
        },

        consultationFee: {
            type: Number,
            required: true
        },

        bio: {
            type: String,
            required: true
        },

        experienceYears: {
            type: Number,
            required: true
        },

        medicalLicenseNumber: {
            type: String,
            required: true,
            unique: true
        },

        approvalStatus: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending"
        },

        approvedAt: {
            type: Date,
            default: null
        },

        rejectionReason: {
            type: String,
            default: ""
        },

        availability: {
            type: [availabilitySchema],
            default: []
        },

        isActive: {
            type: Boolean,
            default: true
        },
        deletedAt: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
);

const Doctor = mongoose.model("Doctor", doctorSchema);

export default Doctor;