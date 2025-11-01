const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["admin", "student"],
      default: "student",
      index: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // This adds createdAt and updatedAt automatically
    collection: "users",
  }
);

// Index for composite queries
userSchema.index({ role: 1 });
userSchema.index({ email: 1, role: 1 });

const User = mongoose.model("User", userSchema);

module.exports = User;
