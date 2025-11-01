const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: [true, "Exam ID is required"],
    },
    type: {
      type: String,
      enum: ["true_false", "multiple_choice", "single_choice"],
      required: [true, "Question type is required"],
    },
    title: {
      type: String,
      required: [true, "Question title is required"],
      trim: true,
      maxlength: [500, "Question title cannot exceed 500 characters"],
    },
    content: {
      type: String,
      required: [true, "Question content is required"],
      trim: true,
      maxlength: [2000, "Question content cannot exceed 2000 characters"],
    },
    points: {
      type: Number,
      default: 1,
      min: [0.5, "Points must be at least 0.5"],
      max: [100, "Points cannot exceed 100"],
    },
    order: {
      type: Number,
      required: [true, "Question order is required"],
      min: [1, "Order must be at least 1"],
    },
    // For true/false questions
    correctAnswer: {
      type: Boolean,
      default: null, // true, false, or null if not applicable
    },
    // For single choice questions
    options: [
      {
        id: {
          type: String,
          required: true,
        },
        text: {
          type: String,
          required: [true, "Option text is required"],
          trim: true,
          maxlength: [500, "Option text cannot exceed 500 characters"],
        },
        isCorrect: {
          type: Boolean,
          default: false,
        },
        order: {
          type: Number,
          required: true,
        },
      },
    ],
    // For multiple choice questions (multiple correct answers)
    correctOptions: [
      {
        type: String, // option IDs
      },
    ],
    explanation: {
      type: String,
      trim: true,
      maxlength: [1000, "Explanation cannot exceed 1000 characters"],
      default: "",
    },
    feedback: {
      type: String,
      trim: true,
      maxlength: [1000, "Feedback cannot exceed 1000 characters"],
      default: "",
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
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
QuestionSchema.index({ examId: 1, order: 1 });
QuestionSchema.index({ type: 1 });
QuestionSchema.index({ isActive: 1 });
QuestionSchema.index({ createdBy: 1 });

// Virtual for question type display name
QuestionSchema.virtual("typeDisplayName").get(function () {
  const typeMap = {
    true_false: "True/False",
    multiple_choice: "Multiple Choice",
    single_choice: "Single Choice",
  };
  return typeMap[this.type] || this.type;
});

// Virtual for difficulty display name
QuestionSchema.virtual("difficultyDisplayName").get(function () {
  const difficultyMap = {
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
  };
  return difficultyMap[this.difficulty] || this.difficulty;
});

// Pre-save middleware to update timestamps
QuestionSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Validation middleware
QuestionSchema.pre("validate", function (next) {
  // Validate options for single choice and multiple choice questions
  if (this.type === "single_choice") {
    if (!this.options || this.options.length < 2) {
      return next(
        new Error("Single choice questions must have at least 2 options")
      );
    }
    const correctOptions = this.options.filter((opt) => opt.isCorrect);
    if (correctOptions.length !== 1) {
      return next(
        new Error("Single choice questions must have exactly 1 correct option")
      );
    }
  }

  if (this.type === "multiple_choice") {
    if (!this.options || this.options.length < 2) {
      return next(
        new Error("Multiple choice questions must have at least 2 options")
      );
    }
    const correctOptions = this.options.filter((opt) => opt.isCorrect);
    if (correctOptions.length < 1) {
      return next(
        new Error(
          "Multiple choice questions must have at least 1 correct option"
        )
      );
    }
  }

  // Validate true/false questions
  if (this.type === "true_false") {
    if (this.correctAnswer === null) {
      return next(new Error("True/False questions must have a correct answer"));
    }
  }

  next();
});

module.exports = mongoose.model("Question", QuestionSchema);
