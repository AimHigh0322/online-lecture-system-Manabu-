const mongoose = require("mongoose");

const ExamAttemptSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: [true, "Exam ID is required"],
    },
    studentId: {
      type: String,
      required: [true, "Student ID is required"],
    },
    studentName: {
      type: String,
      required: [true, "Student name is required"],
    },
    attemptNumber: {
      type: Number,
      required: [true, "Attempt number is required"],
      min: [1, "Attempt number must be at least 1"],
    },
    status: {
      type: String,
      enum: ["in_progress", "completed", "abandoned", "timeout"],
      default: "in_progress",
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    timeSpent: {
      type: Number, // in minutes
      default: 0,
    },
    answers: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Question",
          required: true,
        },
        answer: {
          // Can be boolean (true/false), string (single choice), or array of strings (multiple choice)
          type: mongoose.Schema.Types.Mixed,
          required: true,
        },
        isCorrect: {
          type: Boolean,
          default: false,
        },
        pointsEarned: {
          type: Number,
          default: 0,
        },
        answeredAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    score: {
      type: Number,
      default: 0,
      min: [0, "Score cannot be negative"],
    },
    percentage: {
      type: Number,
      default: 0,
      min: [0, "Percentage cannot be negative"],
      max: [100, "Percentage cannot exceed 100"],
    },
    passed: {
      type: Boolean,
      default: false,
    },
    feedback: {
      type: String,
      trim: true,
      maxlength: [1000, "Feedback cannot exceed 1000 characters"],
      default: "",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better performance
ExamAttemptSchema.index(
  { examId: 1, studentId: 1, attemptNumber: 1 },
  { unique: true }
);
ExamAttemptSchema.index({ examId: 1 });
ExamAttemptSchema.index({ studentId: 1 });
ExamAttemptSchema.index({ status: 1 });
ExamAttemptSchema.index({ completedAt: -1 });

// Virtual for duration in hours
ExamAttemptSchema.virtual("durationHours").get(function () {
  return (this.timeSpent / 60).toFixed(2);
});

// Virtual for grade letter
ExamAttemptSchema.virtual("gradeLetter").get(function () {
  if (this.percentage >= 90) return "A";
  if (this.percentage >= 80) return "B";
  if (this.percentage >= 70) return "C";
  if (this.percentage >= 60) return "D";
  return "F";
});

// Pre-save middleware to update timestamps
ExamAttemptSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("ExamAttempt", ExamAttemptSchema);
