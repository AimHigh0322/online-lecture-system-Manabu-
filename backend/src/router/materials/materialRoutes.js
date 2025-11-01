const express = require("express");
const router = express.Router();
const {
  getAllMaterials,
  getMaterialById,
  uploadVideoAndCreateMaterial,
  updateMaterial,
  deleteMaterial,
  checkTitleExists,
  upload,
} = require("../../controllers/materialController");

// Get all materials (with optional courseId filter)
router.get("/", getAllMaterials);

// Check if title exists
router.get("/check-title", checkTitleExists);

// Get material by ID
router.get("/:id", getMaterialById);

// Upload video and create material
router.post("/upload", upload.single("video"), uploadVideoAndCreateMaterial);

// Update material
router.put("/:id", updateMaterial);

// Delete material
router.delete("/:id", deleteMaterial);

module.exports = router;
