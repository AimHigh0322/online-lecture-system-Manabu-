const Material = require("../model/Material");
const Course = require("../model/Course");
const path = require("path");
const fs = require("fs").promises;
const multer = require("multer");

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../../public/uploads/videos");
    // Ensure directory exists
    fs.mkdir(uploadPath, { recursive: true })
      .then(() => {
        cb(null, uploadPath);
      })
      .catch((err) => {
        cb(err, null);
      });
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(file.originalname);
    const fileName = `video_${uniqueSuffix}${fileExtension}`;
    cb(null, fileName);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is a video and specifically allow common video formats
    const allowedMimeTypes = [
      "video/mp4",
      "video/avi",
      "video/x-msvideo", // Alternative AVI MIME type
      "video/quicktime", // MOV files
      "video/x-ms-wmv", // WMV files
      "video/webm",
      "video/ogg",
    ];

    if (
      file.mimetype.startsWith("video/") ||
      allowedMimeTypes.includes(file.mimetype)
    ) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only video files are allowed! Supported formats: MP4, AVI, MOV, WMV, WebM, OGG"
        ),
        false
      );
    }
  },
});

// Get all materials
const getAllMaterials = async (req, res) => {
  try {
    const { courseId, page = 1, limit = 10 } = req.query;

    let query = {};
    if (courseId) {
      query.courseId = courseId;
    }

    const materials = await Material.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Material.countDocuments(query);

    res.json({
      success: true,
      materials,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error("❌ Error getting materials:", error);
    res.status(500).json({
      success: false,
      message: "教材の取得に失敗しました",
      error: error.message,
    });
  }
};

// Get material by ID
const getMaterialById = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);

    if (!material) {
      return res.status(404).json({
        success: false,
        message: "教材が見つかりません",
      });
    }

    res.json({
      success: true,
      material,
    });
  } catch (error) {
    console.error("❌ Error getting material:", error);
    res.status(500).json({
      success: false,
      message: "教材の取得に失敗しました",
      error: error.message,
    });
  }
};

// Upload video and create material
const uploadVideoAndCreateMaterial = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "動画ファイルが選択されていません",
      });
    }

    const { title, description, courseId, courseName, tags, uploadedBy } =
      req.body;

    // Validate required fields
    if (!title || !description || !courseId || !courseName || !uploadedBy) {
      // Clean up uploaded file if validation fails
      if (req.file) {
        await fs.unlink(req.file.path).catch(console.error);
      }
      return res.status(400).json({
        success: false,
        message: "必須フィールドが不足しています",
      });
    }

    // Check for duplicate title within the same course
    const existingMaterial = await Material.findOne({
      title: title.trim(),
      courseId: courseId,
    });
    if (existingMaterial) {
      // Clean up uploaded file if duplicate title found
      if (req.file) {
        await fs.unlink(req.file.path).catch(console.error);
      }
      return res.status(409).json({
        success: false,
        message: "このコース内で同じタイトルの教材が既に存在します。",
        duplicateTitle: title.trim(),
      });
    }

    // Create video URL path
    const videoUrl = `/uploads/videos/${req.file.filename}`;

    // Parse tags if provided
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = JSON.parse(tags);
      } catch (e) {
        parsedTags = tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag);
      }
    }

    // Create material document
    const materialData = {
      title: title.trim(),
      description: description.trim(),
      courseId,
      courseName: courseName.trim(),
      videoUrl,
      videoFileName: req.file.originalname,
      videoSize: req.file.size,
      tags: parsedTags,
      uploadedBy,
    };

    const material = new Material(materialData);
    await material.save();

    res.status(201).json({
      success: true,
      message: "教材が正常にアップロードされました",
      material,
    });
  } catch (error) {
    console.error("❌ Error uploading video and creating material:", error);

    // Clean up uploaded file if database save fails
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }

    res.status(500).json({
      success: false,
      message: "教材のアップロードに失敗しました",
      error: error.message,
    });
  }
};

// Update material
const updateMaterial = async (req, res) => {
  try {
    const { title, description, courseId, courseName, tags } = req.body;

    const updateData = {};

    if (title) updateData.title = title.trim();
    if (description) updateData.description = description.trim();
    if (courseId) updateData.courseId = courseId;
    if (courseName) updateData.courseName = courseName.trim();
    if (tags) {
      let parsedTags = [];
      try {
        parsedTags = JSON.parse(tags);
      } catch (e) {
        parsedTags = tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag);
      }
      updateData.tags = parsedTags;
    }

    updateData.lastModified = new Date();

    const material = await Material.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!material) {
      return res.status(404).json({
        success: false,
        message: "教材が見つかりません",
      });
    }

    res.json({
      success: true,
      message: "教材が正常に更新されました",
      material,
    });
  } catch (error) {
    console.error("❌ Error updating material:", error);
    res.status(500).json({
      success: false,
      message: "教材の更新に失敗しました",
      error: error.message,
    });
  }
};

// Check if material title exists within a course
const checkTitleExists = async (req, res) => {
  try {
    const { title, courseId } = req.query;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "タイトルが必要です",
      });
    }

    let query = { title: title.trim() };
    if (courseId) {
      query.courseId = courseId;
    }

    const existingMaterial = await Material.findOne(query);

    res.json({
      success: true,
      exists: !!existingMaterial,
      title: title.trim(),
      courseId: courseId || null,
    });
  } catch (error) {
    console.error("❌ Error checking title:", error);
    res.status(500).json({
      success: false,
      message: "タイトルの確認に失敗しました",
      error: error.message,
    });
  }
};

// Delete material
const deleteMaterial = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);

    if (!material) {
      return res.status(404).json({
        success: false,
        message: "教材が見つかりません",
      });
    }

    // Delete the video file
    const videoPath = path.join(__dirname, "../../public", material.videoUrl);
    try {
      await fs.unlink(videoPath);
    } catch (fileError) {
      console.warn("⚠️ Could not delete video file:", fileError.message);
    }

    // Remove this material's progress from all courses in the same courseId
    try {
      const result = await Course.updateMany(
        { courseId: material.courseId },
        {
          $pull: {
            lectureProgress: {
              materialName: material.title,
            },
          },
        }
      );
    } catch (courseUpdateError) {
      console.warn(
        "⚠️ Could not update course progress:",
        courseUpdateError.message
      );
      // Don't fail the entire operation if course update fails
    }

    // Delete the material document
    await Material.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "教材が正常に削除されました",
    });
  } catch (error) {
    console.error("❌ Error deleting material:", error);
    res.status(500).json({
      success: false,
      message: "教材の削除に失敗しました",
      error: error.message,
    });
  }
};

module.exports = {
  getAllMaterials,
  getMaterialById,
  uploadVideoAndCreateMaterial,
  updateMaterial,
  deleteMaterial,
  checkTitleExists,
  upload, // Export multer upload middleware
};
