const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    certificateNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    issueDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    issuedBy: {
      type: String, // Admin user ID who issued the certificate
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "certificates",
  }
);

// Index to ensure one certificate per user
certificateSchema.index({ userId: 1 }, { unique: true });

const Certificate = mongoose.model("Certificate", certificateSchema);

module.exports = Certificate;

