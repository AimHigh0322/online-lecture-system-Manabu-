const Certificate = require("../model/Certificate");
const Profile = require("../model/Profile");
const Course = require("../model/Course");
const User = require("../model/User");
const Notification = require("../model/Notification");

/**
 * Issue certificate to a student (admin only)
 * @route POST /api/certificates/issue
 */
const issueCertificate = async (req, res) => {
  try {
    const { userId } = req.body;
    const adminId = req.user.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    // Check if certificate already exists for this user
    const existingCertificate = await Certificate.findOne({ userId });
    if (existingCertificate) {
      return res.status(400).json({
        success: false,
        message: "Certificate already issued for this user",
      });
    }

    // Get user profile
    const profile = await Profile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    // Get user info
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get all courses for this user
    const courses = await Course.find({ userId }).sort({ enrollmentAt: 1 });

    if (courses.length === 0) {
      return res.status(400).json({
        success: false,
        message: "User has no enrolled courses",
      });
    }

    // Get start date (first course enrollment date)
    const startDate = courses[0].enrollmentAt;

    // Get end date (last course completion date or last course enrollment date)
    const completedCourses = courses.filter(
      (course) => course.status === "completed" && course.completedAt
    );
    const endDate =
      completedCourses.length > 0
        ? completedCourses[completedCourses.length - 1].completedAt
        : courses[courses.length - 1].enrollmentAt;

    // Generate certificate number (format: 01, 02, 03, ...)
    const lastCertificate = await Certificate.findOne()
      .sort({ certificateNumber: -1 })
      .limit(1);
    
    let certificateNumber = "01";
    if (lastCertificate && lastCertificate.certificateNumber) {
      const lastNumber = parseInt(lastCertificate.certificateNumber, 10);
      if (!isNaN(lastNumber)) {
        const nextNumber = lastNumber + 1;
        certificateNumber = nextNumber.toString().padStart(2, "0");
      }
    }

    // Create certificate
    const certificate = new Certificate({
      userId,
      certificateNumber,
      name: user.username,
      gender: profile.gender === "男性" ? "男" : profile.gender === "女性" ? "女" : "未設定",
      startDate,
      endDate,
      issueDate: new Date(),
      issuedBy: adminId,
    });

    await certificate.save();

    // Send notification to user
    try {
      const notification = new Notification({
        title: "修了証発行完了",
        message: "修了証が発行されました。修了証を確認してください。",
        recipientId: userId,
        senderId: adminId,
        type: "success",
      });
      await notification.save();
    } catch (error) {
      console.error("Error sending certificate notification:", error);
      // Don't fail certificate issuance if notification fails
    }

    res.status(201).json({
      success: true,
      message: "Certificate issued successfully",
      data: certificate,
    });
  } catch (error) {
    console.error("Error issuing certificate:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Get certificate for a user
 * @route GET /api/certificates/:userId
 */
const getCertificate = async (req, res) => {
  try {
    const { userId } = req.params;
    const requesterId = req.user.userId;
    const requesterRole = req.user.role;

    // Users can only view their own certificate, admins can view any
    if (requesterRole !== "admin" && requesterId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const certificate = await Certificate.findOne({ userId });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found",
      });
    }

    res.json({
      success: true,
      data: certificate,
    });
  } catch (error) {
    console.error("Error fetching certificate:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Check if certificate exists for a user
 * @route GET /api/certificates/check/:userId
 */
const checkCertificate = async (req, res) => {
  try {
    const { userId } = req.params;

    const certificate = await Certificate.findOne({ userId });

    res.json({
      success: true,
      data: {
        exists: !!certificate,
        certificate: certificate || null,
      },
    });
  } catch (error) {
    console.error("Error checking certificate:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  issueCertificate,
  getCertificate,
  checkCertificate,
};

