const User = require("../model/User");
const Profile = require("../model/Profile");

/**
 * Delete a user (admin only)
 * @route DELETE /api/admin/users/:userId
 */
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.userId;

    // Check if admin is trying to delete themselves
    if (adminId === userId) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    // Find the user to delete
    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Delete user profile first
    await Profile.findOneAndDelete({ userId });

    // Delete the user
    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Block/Unblock a user (admin only)
 * @route PATCH /api/admin/users/:userId/block
 */
const toggleUserBlock = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isBlocked } = req.body;
    const adminId = req.user.userId;

    // Check if admin is trying to block themselves
    if (adminId === userId) {
      return res.status(400).json({
        success: false,
        message: "You cannot block your own account",
      });
    }

    // Find and update the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update user's blocked status
    user.isBlocked = isBlocked;
    await user.save();

    res.json({
      success: true,
      message: `User ${isBlocked ? "blocked" : "unblocked"} successfully`,
      data: {
        userId: user._id,
        isBlocked: user.isBlocked,
      },
    });
  } catch (error) {
    console.error("Error toggling user block:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Get all users (admin only)
 * @route GET /api/admin/users
 */
const getAllUsers = async (req, res) => {
  try {
    // Get all users with their profiles
    const users = await User.find({}).select("-password");
    const profiles = await Profile.find({});

    // Combine user and profile data
    const usersWithProfiles = users.map((user) => {
      const profile = profiles.find((p) => p.userId === user._id.toString());
      return {
        id: user._id.toString(),
        userId: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
        displayName: profile?.displayName || user.username,
        avatar: profile?.avatar || "",
        phone: profile?.phone || "",
        gender: profile?.gender || "",
        birthday: profile?.birthday || "",
        joinedDate: user.createdAt,
        lastLogin: user.lastLoginAt,
        isBlocked: user.isBlocked || false,
      };
    });

    res.json({
      success: true,
      data: usersWithProfiles,
    });
  } catch (error) {
    console.error("Error getting all users:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  deleteUser,
  toggleUserBlock,
  getAllUsers,
};
