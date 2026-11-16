import mongoose from "mongoose";
import User from "../models/User.js";

// BLOCK USER
export const blockUser = async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user._id;

    if (!mongoose.isValidObjectId(targetUserId)) {
      return res.status(400).json({
        message: "Invalid user ID.",
      });
    }

    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({
        message: "You cannot block yourself.",
      });
    }

    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    // BLOCK USER AND REMOVE EXISTING FOLLOW RELATIONSHIP
    await Promise.all([
      User.updateOne(
        { _id: currentUserId },
        {
          $addToSet: { blockedUsers: targetUserId },
          $pull: {
            following: targetUserId,
            followers: targetUserId,
          },
        },
      ),

      User.updateOne(
        { _id: targetUserId },
        {
          $pull: {
            followers: currentUserId,
            following: currentUserId,
          },
        },
      ),
    ]);

    return res.status(200).json({
      message: "User blocked successfully.",
    });
  } catch (error) {
    console.error("Block user error:", error);

    return res.status(500).json({
      message: "Unable to block user.",
    });
  }
};

// UNBLOCK USER
export const unblockUser = async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user._id;

    if (!mongoose.isValidObjectId(targetUserId)) {
      return res.status(400).json({
        message: "Invalid user ID.",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      currentUserId,
      {
        $pull: {
          blockedUsers: targetUserId,
        },
      },
      {
        new: true,
      },
    );

    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    return res.status(200).json({
      message: "User unblocked successfully.",
    });
  } catch (error) {
    console.error("Unblock user error:", error);

    return res.status(500).json({
      message: "Unable to unblock user.",
    });
  }
};

// GET BLOCKED USERS
export const getBlockedUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("blockedUsers", "username fullName profilePicture bio status")
      .select("blockedUsers");

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    return res.status(200).json({
      users: user.blockedUsers,
      count: user.blockedUsers.length,
    });
  } catch (error) {
    console.error("Get blocked users error:", error);

    return res.status(500).json({
      message: "Unable to fetch blocked users.",
    });
  }
};
