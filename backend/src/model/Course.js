const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    courseId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    courseName: {
      type: String,
      required: true,
      trim: true,
    },
    // Student credentials for this course
    studentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
    },
    // Enrollment details
    enrollmentAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    // Course progress and status
    // Video progress with percentage: [{ materialName, progress }]
    videoProgress: [
      {
        materialName: {
          type: String,
          required: true,
        },
        progress: {
          type: Number,
          required: true,
          min: 0,
          max: 100,
        },
      },
    ],
    // Document progress without percentage (completed/not completed): [materialName]
    documentProgress: [
      {
        materialName: {
          type: String,
          required: true,
        },
      },
    ],
    // Legacy lectureProgress for backward compatibility (will be migrated gradually)
    lectureProgress: [
      {
        materialName: {
          type: String,
          required: true,
        },
        progress: {
          type: Number,
          required: true,
          min: 0,
          max: 100,
        },
      },
    ],
    // Overall course completion rate (calculated from videoProgress only)
    completionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    // Exam eligibility status
    examEligible: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "completed", "suspended", "cancelled"],
      default: "active",
      index: true,
    },
    // Payment information
    paymentId: {
      type: String,
      default: null,
    },
    subscriptionId: {
      type: String,
      default: null,
    },
    paymentAmount: {
      type: Number,
      default: 0,
    },
    // Course access
    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    // Additional information
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    collection: "courses",
  }
);

// Compound index to ensure one user can enroll in same course only once
courseSchema.index({ userId: 1, courseId: 1 }, { unique: true });

// Indexes for faster queries
courseSchema.index({ userId: 1, status: 1 });
courseSchema.index({ status: 1, enrollmentAt: -1 });
courseSchema.index({ studentId: 1 });

const Course = mongoose.model("Course", courseSchema);

module.exports = Course;
