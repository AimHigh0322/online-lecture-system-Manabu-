require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const { connectDatabase } = require("./db/connection");

const app = express();

// Environment-based configuration
const isProduction = process.env.NODE_ENV === "production";

// Build allowed origins list
const allowedOrigins = [
  "http://localhost:5173",
  "http://85.131.238.90:5173",
  "http://manabou.co.jp:5173",
  "https://manabou.co.jp",
  "http://manabou.co.jp",
];

// Add environment variable origins if provided
if (isProduction && process.env.PROD_CORS_ORIGIN) {
  const prodOrigins = process.env.PROD_CORS_ORIGIN.split(",").map((origin) =>
    origin.trim()
  );
  allowedOrigins.push(...prodOrigins);
} else if (!isProduction && process.env.DEV_CORS_ORIGIN) {
  const devOrigins = process.env.DEV_CORS_ORIGIN.split(",").map((origin) =>
    origin.trim()
  );
  allowedOrigins.push(...devOrigins);
}

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        // In development, allow all origins; in production, be strict
        if (!isProduction) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Authorization"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
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
const notificationRoutes = require("./router/notifications/notificationRoutes");
const certificateRoutes = require("./router/certificates/certificateRoutes");

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
app.use("/api/notifications", notificationRoutes);
app.use("/api/certificates", certificateRoutes);

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
