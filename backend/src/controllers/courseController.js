const Course = require("../model/Course");
const User = require("../model/User");

// Get all courses for a specific user
const getUserCourses = async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "ユーザーが見つかりません",
      });
    }

    // Get all courses for this user
    const courses = await Course.find({ userId: userId })
      .select(
        "courseId courseName studentId password enrollmentAt lectureProgress status lastAccessedAt"
      )
      .sort({ enrollmentAt: -1 });

    res.json({
      success: true,
      courses: courses,
      count: courses.length,
    });
  } catch (error) {
    console.error("❌ Error getting user courses:", error);
    res.status(500).json({
      success: false,
      message: "コースの取得に失敗しました",
      error: error.message,
    });
  }
};

// Get specific course details
const getCourseById = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "認証が必要です",
      });
    }

    // Get course details
    const course = await Course.findOne({
      courseId: courseId,
      userId: userId,
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "コースが見つかりません",
      });
    }

    res.json({
      success: true,
      course: course,
    });
  } catch (error) {
    console.error("❌ Error getting course details:", error);
    res.status(500).json({
      success: false,
      message: "コース詳細の取得に失敗しました",
      error: error.message,
    });
  }
};

// Update course lecture progress for a specific material
const updateCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { materialName, progress } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "認証が必要です",
      });
    }

    // Validate materialName
    if (!materialName || typeof materialName !== "string") {
      return res.status(400).json({
        success: false,
        message: "教材名が必要です",
      });
    }

    // Validate progress
    if (typeof progress !== "number" || progress < 0 || progress > 100) {
      return res.status(400).json({
        success: false,
        message: "進捗は0-100の間で指定してください",
      });
    }

    // Find the current course
    const course = await Course.findOne({
      courseId: courseId,
      userId: userId,
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "コースが見つかりません",
      });
    }

    // Find existing progress entry for this material
    const existingProgressIndex = course.lectureProgress.findIndex(
      (item) => item.materialName === materialName
    );

    // Check if this material's progress is already 100
    if (
      existingProgressIndex !== -1 &&
      course.lectureProgress[existingProgressIndex].progress === 100
    ) {
      return res.json({
        success: true,
        course: course,
        skipped: true,
      });
    }

    // Update or add progress for this material
    if (existingProgressIndex !== -1) {
      // Update existing entry
      course.lectureProgress[existingProgressIndex].progress = progress;
    } else {
      // Add new entry
      course.lectureProgress.push({
        materialName: materialName,
        progress: progress,
      });
    }

    // Calculate completion rate based on lecture progress
    const calculateCompletionRate = (lectureProgress) => {
      if (!lectureProgress || lectureProgress.length === 0) return 0;

      const totalProgress = lectureProgress.reduce(
        (sum, item) => sum + item.progress,
        0
      );
      return Math.round(totalProgress / lectureProgress.length);
    };

    // Update completion rate
    course.completionRate = calculateCompletionRate(course.lectureProgress);

    // Check if course is completed (100% completion rate)
    if (course.completionRate === 100) {
      course.status = "completed";
      course.completedAt = new Date();
    }

    course.lastAccessedAt = new Date();
    await course.save();

    // Check exam eligibility for this user after updating progress
    try {
      const allUserCourses = await Course.find({
        userId: userId,
        status: { $in: ["active", "completed"] },
      }).select("completionRate");

      const allCoursesCompleted = allUserCourses.every(
        (course) => course.completionRate === 100
      );

      // Update exam eligibility for all user's courses
      await Course.updateMany(
        { userId: userId, status: { $in: ["active", "completed"] } },
        { examEligible: allCoursesCompleted }
      );
    } catch (eligibilityError) {
      console.error("Error checking exam eligibility:", eligibilityError);
      // Don't fail the main request if eligibility check fails
    }

    res.json({
      success: true,
      course: course,
      message: "進捗が更新されました",
    });
  } catch (error) {
    console.error("❌ Error updating course lecture progress:", error);
    res.status(500).json({
      success: false,
      message: "進捗の更新に失敗しました",
      error: error.message,
    });
  }
};

// Check exam eligibility for a user
const checkExamEligibility = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "認証が必要です",
      });
    }

    // Get all active and completed courses for this user
    const courses = await Course.find({
      userId: userId,
      status: { $in: ["active", "completed"] },
    }).select("courseId courseName completionRate examEligible status");

    // Check if all courses have 100% completion rate
    const allCoursesCompleted = courses.every(
      (course) => course.completionRate === 100
    );

    // Update exam eligibility for all courses
    if (allCoursesCompleted) {
      await Course.updateMany(
        { userId: userId, status: { $in: ["active", "completed"] } },
        { examEligible: true }
      );
    } else {
      await Course.updateMany(
        { userId: userId, status: { $in: ["active", "completed"] } },
        { examEligible: false }
      );
    }

    res.json({
      success: true,
      examEligible: allCoursesCompleted,
      courses: courses,
      message: allCoursesCompleted
        ? "すべてのコースが完了しました。試験を受けることができます。"
        : "まだコースが完了していません。",
    });
  } catch (error) {
    console.error("❌ Error checking exam eligibility:", error);
    res.status(500).json({
      success: false,
      message: "試験資格の確認に失敗しました",
      error: error.message,
    });
  }
};

// Get exam eligibility status for a user
const getExamEligibility = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "認証が必要です",
      });
    }

    // Get all active and completed courses for this user
    const courses = await Course.find({
      userId: userId,
      status: { $in: ["active", "completed"] },
    }).select("courseId courseName completionRate examEligible status");

    // Check if all courses have 100% completion rate
    const allCoursesCompleted = courses.every(
      (course) => course.completionRate === 100
    );

    res.json({
      success: true,
      examEligible: allCoursesCompleted,
      courses: courses,
    });
  } catch (error) {
    console.error("❌ Error getting exam eligibility:", error);
    res.status(500).json({
      success: false,
      message: "試験資格の取得に失敗しました",
      error: error.message,
    });
  }
};

module.exports = {
  getUserCourses,
  getCourseById,
  updateCourseProgress,
  checkExamEligibility,
  getExamEligibility,
};
