const express = require("express");
const router = express.Router();
const {
  deleteUser,
  toggleUserBlock,
  getAllUsers,
} = require("../../controllers/adminController");
const authenticateToken = require("../../middleware/auth");

// Apply authentication middleware to all admin routes
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

// Apply admin role requirement to all routes
router.use(requireAdmin);

// Admin user management routes
router.get("/users", getAllUsers);
router.delete("/users/:userId", deleteUser);
router.patch("/users/:userId/block", toggleUserBlock);

module.exports = router;
