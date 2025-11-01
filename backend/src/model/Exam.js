const mongoose = require("mongoose");

const ExamSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Exam title is required"],
      trim: true,
      maxlength: [200, "Exam title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Exam description is required"],
      trim: true,
      maxlength: [1000, "Exam description cannot exceed 1000 characters"],
    },
    courseId: {
      type: String,
      required: [true, "Course ID is required"],
    },
    courseName: {
      type: String,
      required: [true, "Course name is required"],
    },
    instructions: {
      type: String,
      trim: true,
      maxlength: [2000, "Instructions cannot exceed 2000 characters"],
      default: "",
    },
    timeLimit: {
      type: Number, // in minutes
      default: null, // null means no time limit
      min: [1, "Time limit must be at least 1 minute"],
      max: [480, "Time limit cannot exceed 8 hours"],
    },
    maxAttempts: {
      type: Number,
      default: 1,
      min: [1, "Max attempts must be at least 1"],
      max: [10, "Max attempts cannot exceed 10"],
    },
    passingScore: {
      type: Number,
      default: 70, // percentage
      min: [0, "Passing score cannot be less than 0"],
      max: [100, "Passing score cannot exceed 100"],
    },
    shuffleQuestions: {
      type: Boolean,
      default: false,
    },
    shuffleOptions: {
      type: Boolean,
      default: false,
    },
    showCorrectAnswers: {
      type: Boolean,
      default: true,
    },
    showFeedback: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
      },
    ],
    totalQuestions: {
      type: Number,
      default: 0,
    },
    totalPoints: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: String,
      required: [true, "Creator is required"],
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
ExamSchema.index({ courseId: 1 });
ExamSchema.index({ status: 1 });
ExamSchema.index({ createdBy: 1 });
ExamSchema.index({ createdAt: -1 });

// Virtual for exam duration in hours
ExamSchema.virtual("durationHours").get(function () {
  return this.timeLimit ? (this.timeLimit / 60).toFixed(1) : null;
});

// Pre-save middleware to update timestamps
ExamSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Exam", ExamSchema);
