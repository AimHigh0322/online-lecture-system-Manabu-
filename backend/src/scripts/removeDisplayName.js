// One-off script to remove displayName from profiles collection
// Usage: node src/scripts/removeDisplayName.js

const mongoose = require("mongoose");
require("dotenv").config();

const Profile = require("../model/Profile");

async function run() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/lecture";
  await mongoose.connect(uri);
  try {
    const result = await mongoose.connection
      .collection("profiles")
      .updateMany({}, { $unset: { displayName: "" } });
    console.log("Removed displayName from profiles:", result.modifiedCount);
  } catch (e) {
    console.error("Failed to remove displayName:", e);
  } finally {
    await mongoose.disconnect();
  }
}

run();


