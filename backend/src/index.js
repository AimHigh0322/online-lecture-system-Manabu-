require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const { connectDatabase } = require("./db/connection");

const app = express();

// Environment-based configuration
const isProduction = process.env.NODE_ENV === "production";
const corsOrigin = isProduction
  ? process.env.PROD_CORS_ORIGIN || "http://85.131.238.90:5173"
  : process.env.DEV_CORS_ORIGIN || "http://localhost:5173";

app.use(
  cors({
    origin: corsOrigin?.split(",") || [
      "http://localhost:5173",
      "http://85.131.238.90:5173",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

const port = Number(process.env.PORT || 4000);

// Update server to listen on all interfaces for VPS deployment
const host = process.env.HOST || "0.0.0.0";

// Import routes
const paymentRoutes = require("./router/payment/paymentRoutes");
const authRoutes = require("./router/auth/authRoutes");
const profileRoutes = require("./router/profile/profileRoutes");
const courseRoutes = require("./router/courses/courseRoutes");
const materialRoutes = require("./router/materials/materialRoutes");
const adminRoutes = require("./router/admin/adminRoutes");
const questionRoutes = require("./router/admin/questionRoutes");
const studentExamRoutes = require("./router/student/studentExamRoutes");
const examRoutes = require("./router/exam/examRoutes");

// API routes
app.use("/api/payment", paymentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/student/exams", studentExamRoutes);
app.use("/api/exam", examRoutes);

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB database (education)
    await connectDatabase();

    // Start Express server
    app.listen(port, host, () => {
      console.log(`Server running on ${host}:${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
