const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
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
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "certificates",
  }
);

// Index for efficient queries
certificateSchema.index({ userId: 1 });
certificateSchema.index({ certificateNumber: 1 });

const Certificate = mongoose.model("Certificate", certificateSchema);

module.exports = Certificate;

