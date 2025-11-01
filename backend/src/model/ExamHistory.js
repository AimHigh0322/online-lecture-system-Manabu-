const mongoose = require("mongoose");

const ExamHistorySchema = new mongoose.Schema(
  {
    examineeId: {
      type: String,
      required: [true, "Examinee ID is required"],
      index: true,
    },
    examineeName: {
      type: String,
      required: [true, "Examinee name is required"],
    },
    answers: [
      {
        questionId: {
          type: String,
          required: true,
        },
        questionContent: {
          type: String,
          required: true,
        },
        questionType: {
          type: String,
          required: true,
          enum: ["true_false", "single_choice", "multiple_choice"],
        },
        answer: {
          type: mongoose.Schema.Types.Mixed, // Can be boolean, string, or array
          default: null,
        },
        answeredAt: {
          type: Date,
          default: null,
        },
        isCorrect: {
          type: Boolean,
          required: true,
        },
        pointsEarned: {
          type: Number,
          required: true,
          default: 0,
        },
        examineeAnswered: {
          type: Boolean,
          required: true,
          default: false,
        },
        correctAnswer: {
          type: mongoose.Schema.Types.Mixed, // Can be boolean, string, or array
          default: null,
        },
        options: [
          {
            id: String,
            text: String,
            isCorrect: Boolean,
            order: Number,
          },
        ],
      },
    ],
    score: {
      type: Number,
      required: [true, "Score is required"],
      min: [0, "Score cannot be negative"],
    },
    totalQuestions: {
      type: Number,
      required: [true, "Total questions is required"],
      min: [1, "Total questions must be at least 1"],
    },
    percentage: {
      type: Number,
      required: [true, "Percentage is required"],
      min: [0, "Percentage cannot be negative"],
      max: [100, "Percentage cannot exceed 100"],
    },
    passed: {
      type: Boolean,
      required: [true, "Passed status is required"],
    },
    passingGrade: {
      type: Number,
      default: 60,
      min: [0, "Passing grade cannot be negative"],
      max: [100, "Passing grade cannot exceed 100"],
    },
    timeAll: {
      type: Number,
      required: [true, "Total time allocated for exam is required"],
      min: [1, "Total time must be at least 1 minute"],
    },
    timeSpent: {
      type: Number,
      required: [true, "Time spent by student is required"],
      min: [0, "Time spent cannot be negative"],
    },
    submittedAt: {
      type: Date,
      required: [true, "Submission date is required"],
    },
    gradedAt: {
      type: Date,
      required: [true, "Grading date is required"],
    },
    status: {
      type: String,
      enum: ["completed", "incomplete", "timeout"],
      default: "completed",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better performance
ExamHistorySchema.index({ examineeId: 1, submittedAt: -1 });
ExamHistorySchema.index({ passed: 1 });
ExamHistorySchema.index({ percentage: 1 });
ExamHistorySchema.index({ submittedAt: -1 });

// Virtual for time spent in minutes
ExamHistorySchema.virtual("timeSpentMinutes").get(function () {
  return Math.floor(this.timeSpent / 60);
});

// Virtual for total time allocated in minutes
ExamHistorySchema.virtual("timeAllMinutes").get(function () {
  return Math.floor(this.timeAll / 60);
});

// Virtual for time efficiency (percentage of time used)
ExamHistorySchema.virtual("timeEfficiency").get(function () {
  return this.timeAll > 0
    ? Math.round((this.timeSpent / this.timeAll) * 100)
    : 0;
});

// Virtual for grade classification
ExamHistorySchema.virtual("gradeClassification").get(function () {
  if (this.percentage >= 90) return "A+";
  if (this.percentage >= 80) return "A";
  if (this.percentage >= 70) return "B";
  if (this.percentage >= 60) return "C";
  return "F";
});

// Pre-save middleware to calculate additional fields
ExamHistorySchema.pre("save", function (next) {
  // Ensure percentage is calculated correctly
  if (this.totalQuestions > 0) {
    this.percentage = Math.round((this.score / this.totalQuestions) * 100);
  }

  // Set passed status based on percentage
  this.passed = this.percentage >= this.passingGrade;

  next();
});

// Static method to get exam statistics for an examinee
ExamHistorySchema.statics.getExamineeStats = async function (examineeId) {
  const stats = await this.aggregate([
    { $match: { examineeId } },
    {
      $group: {
        _id: null,
        totalExams: { $sum: 1 },
        averageScore: { $avg: "$score" },
        averagePercentage: { $avg: "$percentage" },
        passedExams: {
          $sum: { $cond: ["$passed", 1, 0] },
        },
        totalTimeSpent: { $sum: "$timeSpent" },
        totalTimeAllocated: { $sum: "$timeAll" },
        bestScore: { $max: "$score" },
        bestPercentage: { $max: "$percentage" },
      },
    },
  ]);

  return (
    stats[0] || {
      totalExams: 0,
      averageScore: 0,
      averagePercentage: 0,
      passedExams: 0,
      totalTimeSpent: 0,
      totalTimeAllocated: 0,
      bestScore: 0,
      bestPercentage: 0,
    }
  );
};

module.exports = mongoose.model("ExamHistory", ExamHistorySchema);
