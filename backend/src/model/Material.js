const mongoose = require("mongoose");

const materialSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["video", "pdf"],
      default: "video",
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    courseId: {
      type: String,
      required: true,
      index: true,
    },
    courseName: {
      type: String,
      required: true,
      trim: true,
    },
    videoUrl: { type: String },
    videoFileName: { type: String },
    videoSize: { type: Number, default: 0 },
    pdfUrl: { type: String },
    pdfFileName: { type: String },
    pdfSize: { type: Number, default: 0 },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    uploadedBy: {
      type: String,
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    lastModified: {
      type: Date,
      default: Date.now,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: "materials",
  }
);

// Indexes for better query performance
materialSchema.index({ courseId: 1 });
materialSchema.index({ uploadedBy: 1 });
materialSchema.index({ createdAt: -1 });
materialSchema.index({ type: 1 });

const Material = mongoose.model("Material", materialSchema);

module.exports = Material;
