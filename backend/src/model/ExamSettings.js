const mongoose = require("mongoose");

const examSettingsSchema = new mongoose.Schema(
  {
    timeLimit: {
      type: Number,
      required: true,
      default: 60,
      min: 1,
      max: 480, // 8 hours max
    },
    numberOfQuestions: {
      type: Number,
      required: true,
      default: 20,
      min: 1,
      max: 100,
    },
    passingScore: {
      type: Number,
      required: true,
      default: 70,
      min: 0,
      max: 100,
    },
    faceVerificationIntervalMinutes: {
      type: Number,
      required: true,
      default: 15,
      min: 1,
      max: 60, // Maximum 60 minutes
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    updatedBy: {
      type: String,
      default: "admin",
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one settings document exists
examSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model("ExamSettings", examSettingsSchema);
