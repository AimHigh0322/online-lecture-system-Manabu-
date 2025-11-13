const stripe = require("../config/stripe");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../model/User");
const Profile = require("../model/Profile");

/**
 * Simple user registration (email, password, username)
 * @route POST /api/auth/register
 */
const registerUser = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      role = "student",
      faceDescriptor,
    } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "ユーザー名、メールアドレス、パスワードが必要です",
      });
    }

    // Face descriptor check
    if (
      !faceDescriptor ||
      !Array.isArray(faceDescriptor) ||
      faceDescriptor.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "顔写真が必要です",
      });
    }

    // Validate role
    if (!["admin", "student"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "無効なロールです",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "このメールアドレスまたはユーザー名は既に使用されています",
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role,
    });

    await newUser.save();

    // Create profile with faceDescriptor
    const newProfile = new Profile({
      userId: newUser._id.toString(),
      faceDescriptor: faceDescriptor, // 👈 store descriptor here
    });

    await newProfile.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id.toString(), email, role },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.status(201).json({
      success: true,
      message: "ユーザー登録が完了しました",
      user: {
        id: newUser._id.toString(),
        username,
        email,
        role,
      },
      token,
    });
  } catch (error) {
    console.error("Error in registerUser:", error);
    res.status(500).json({
      success: false,
      message: "ユーザー登録中にエラーが発生しました",
    });
  }
};

/**
 * Login user with ID/Email and password
 * @route POST /api/auth/login
 */
const loginUser = async (req, res) => {
  try {
    const { id, password } = req.body;

    // Validate input
    if (!id || !password) {
      return res.status(400).json({
        success: false,
        message: "Email/ID and password are required",
      });
    }

    // Validate user credentials (supports both email and userId)
    const user = await validateUserCredentials(id, password);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email/ID or password",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET || "fallback-secret-key",
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
};

/**
 * Validate user credentials
 * Queries the database and verifies password using bcrypt
 * Supports login with both email and userId
 */
const validateUserCredentials = async (id, password) => {
  try {
    // Check if input looks like an email
    const isEmail = id.includes("@");

    // Query the database for the user by email or username
    const user = await User.findOne({
      $or: [{ email: id }, { username: id }],
    });

    if (!user) {
      return null;
    }

    // Compare the provided password with the hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    return {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
    };
  } catch (error) {
    console.error("Error validating credentials:", error);
    return null;
  }
};

/**
 * Verify JWT token (middleware function)
 */
const verifyToken = (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback-secret-key"
    );
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

/**
 * Get current user profile
 * @route GET /api/auth/profile
 */
const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.user;

    // Fetch user data from database
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Fetch profile data
    const profile = await Profile.findOne({ userId: userId });

    // Combine user and profile data
    const userProfile = {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: profile?.avatar || "",
      phone: profile?.phone || "",
      gender: profile?.gender || "未設定",
      birthday: profile?.birthday || null,
      joinedDate: user.createdAt,
      lastLogin: user.lastLoginAt,
    };

    res.status(200).json({
      success: true,
      user: userProfile,
    });
  } catch (error) {
    console.error("Error getting user profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user profile",
      error: error.message,
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  verifyToken,
  getUserProfile,
};
