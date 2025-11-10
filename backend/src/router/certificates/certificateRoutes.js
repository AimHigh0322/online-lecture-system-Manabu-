const express = require("express");
const router = express.Router();
const {
  issueCertificate,
  getCertificate,
  checkCertificate,
} = require("../../controllers/certificateController");
const authenticateToken = require("../../middleware/auth");

// Apply authentication middleware to all certificate routes
router.use(authenticateToken);

// Admin-only middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin role required.",
    });
  }
  next();
};

// Admin routes
router.post("/issue", requireAdmin, issueCertificate);

// User routes
router.get("/:userId", getCertificate);
router.get("/check/:userId", checkCertificate);

module.exports = router;

