const mongoose = require("mongoose");

const StandaloneQuestionSchema = new mongoose.Schema(
  {
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
    courseId: {
      type: String,
      required: [true, "Course ID is required"],
    },
    courseName: {
      type: String,
      required: [true, "Course name is required"],
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
    estimatedTime: {
      type: Number,
      default: 2,
      min: [1, "Estimated time must be at least 1 minute"],
      max: [60, "Estimated time cannot exceed 60 minutes"],
    },
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
StandaloneQuestionSchema.index({ type: 1 });
StandaloneQuestionSchema.index({ courseId: 1 });
StandaloneQuestionSchema.index({ isActive: 1 });
StandaloneQuestionSchema.index({ createdBy: 1 });

// Virtual for question type display name
StandaloneQuestionSchema.virtual("typeDisplayName").get(function () {
  const typeMap = {
    true_false: "正誤問題",
    multiple_choice: "複数選択",
    single_choice: "単一選択",
  };
  return typeMap[this.type] || this.type;
});

// Pre-save middleware to update timestamps
StandaloneQuestionSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Validation middleware
StandaloneQuestionSchema.pre("validate", function (next) {
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
    if (this.correctAnswer === null || this.correctAnswer === undefined) {
      return next(new Error("True/False questions must have a correct answer"));
    }
  }

  next();
});

module.exports = mongoose.model("StandaloneQuestion", StandaloneQuestionSchema);
