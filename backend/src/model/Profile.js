const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      default: "",
    },
    gender: {
      type: String,
      enum: ["男性", "女性", "その他", "未設定"],
      default: "未設定",
    },
    birthday: {
      type: Date,
      default: null,
    },
    // 👇 NEW: Face descriptor stored as array of numbers
    faceDescriptor: {
      type: [Number], // an array of numbers from face-api.js
      default: [],
    },
  },
  {
    timestamps: true,
    collection: "profiles",
  }
);

const Profile = mongoose.model("Profile", profileSchema);

module.exports = Profile;
