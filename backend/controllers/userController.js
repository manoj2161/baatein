import mongoose from "mongoose";
import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";

// UPLOAD PROFILE IMAGE TO CLOUDINARY
const uploadProfileImage = (file) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "baatein/profile-pictures",
        resource_type: "image",
        transformation: [
          { width: 500, height: 500, crop: "limit" },
          { quality: "auto" },
          { fetch_format: "auto" },
        ],
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      },
    );

    stream.end(file.buffer);
  });
};

// CHECK WHETHER EITHER USER HAS BLOCKED THE OTHER
const isBlockedBetweenUsers = async (userId1, userId2) => {
  const [user1, user2] = await Promise.all([
    User.findById(userId1).select("blockedUsers"),
    User.findById(userId2).select("blockedUsers"),
  ]);

  if (!user1 || !user2) return true;

  const user1BlocksUser2 = user1.blockedUsers?.some(
    (id) => id.toString() === userId2.toString(),
  );

  const user2BlocksUser1 = user2.blockedUsers?.some(
    (id) => id.toString() === userId1.toString(),
  );

  return user1BlocksUser2 || user2BlocksUser1;
};

// GET LOGGED-IN USER PROFILE
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "-password -blockedUsers",
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    return res.status(200).json({
      user,
    });
  } catch (error) {
    console.error("Get profile error:", error);

    return res.status(500).json({
      message: "Unable to fetch profile.",
    });
  }
};

// CHECK USERNAME AVAILABILITY
export const checkUsernameAvailability = async (req, res) => {
  try {
    const username = (req.query.username || "").trim().toLowerCase();

    const usernameRegex = /^[a-z0-9._]{3,30}$/;

    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        available: false,
        message:
          "Username must be 3-30 characters and contain only lowercase letters, numbers, periods, and underscores.",
      });
    }

    const existingUser = await User.findOne({
      username,
      _id: { $ne: req.user._id },
    }).select("_id");

    return res.status(200).json({
      available: !existingUser,
      message: existingUser
        ? "This username is already taken."
        : "Username is available.",
    });
  } catch (error) {
    console.error("Username availability error:", error);

    return res.status(500).json({
      available: false,
      message: "Unable to check username availability.",
    });
  }
};

// UPDATE PROFILE
export const updateProfile = async (req, res) => {
  try {
    const { username, fullName, bio, status } = req.body;

    const updates = {};

    // UPDATE USERNAME
    if (username !== undefined) {
      const normalizedUsername = username.trim().toLowerCase();
      const usernameRegex = /^[a-z0-9._]{3,30}$/;

      if (!usernameRegex.test(normalizedUsername)) {
        return res.status(400).json({
          message:
            "Username must be 3-30 characters and contain only lowercase letters, numbers, periods, and underscores.",
        });
      }

      const existingUser = await User.findOne({
        username: normalizedUsername,
        _id: { $ne: req.user._id },
      }).select("_id");

      if (existingUser) {
        return res.status(409).json({
          message: "This username is already taken.",
        });
      }

      updates.username = normalizedUsername;
    }

    // UPDATE FULL NAME
    if (fullName !== undefined) {
      const normalizedFullName = fullName.trim();

      if (normalizedFullName.length > 50) {
        return res.status(400).json({
          message: "Full name cannot exceed 50 characters.",
        });
      }

      updates.fullName = normalizedFullName;
    }

    // UPDATE BIO
    if (bio !== undefined) {
      const normalizedBio = bio.trim();

      if (normalizedBio.length > 150) {
        return res.status(400).json({
          message: "Bio cannot exceed 150 characters.",
        });
      }

      updates.bio = normalizedBio;
    }

    // UPDATE STATUS
    if (status !== undefined) {
      const normalizedStatus = status.trim();

      if (normalizedStatus.length > 60) {
        return res.status(400).json({
          message: "Status cannot exceed 60 characters.",
        });
      }

      updates.status = normalizedStatus;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      },
    ).select("-password -blockedUsers");

    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    return res.status(200).json({
      message: "Profile updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);

    if (error.code === 11000 && error.keyPattern?.username) {
      return res.status(409).json({
        message: "This username is already taken.",
      });
    }

    return res.status(500).json({
      message: "Unable to update profile.",
    });
  }
};

// UPLOAD PROFILE PICTURE
export const updateProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Please select a profile picture.",
      });
    }

    const uploadedImage = await uploadProfileImage(req.file);

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          profilePicture: uploadedImage.secure_url,
        },
      },
      {
        new: true,
      },
    ).select("-password -blockedUsers");

    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    return res.status(200).json({
      message: "Profile picture updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Profile picture upload error:", error);

    return res.status(500).json({
      message: "Unable to upload profile picture.",
    });
  }
};

// REMOVE PROFILE PICTURE
export const removeProfilePicture = async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          profilePicture: "",
        },
      },
      {
        new: true,
      },
    ).select("-password -blockedUsers");

    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    return res.status(200).json({
      message: "Profile picture removed successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Remove profile picture error:", error);

    return res.status(500).json({
      message: "Unable to remove profile picture.",
    });
  }
};

// GET ALL USERS
export const getUsers = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const currentUser =
      await User.findById(currentUserId).select("blockedUsers");

    if (!currentUser) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    const blockedUserIds = currentUser.blockedUsers || [];

    const users = await User.find({
      _id: {
        $ne: currentUserId,
        $nin: blockedUserIds,
      },
      blockedUsers: {
        $ne: currentUserId,
      },
    })
      .select("-password -blockedUsers")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      users,
    });
  } catch (error) {
    console.error("Get users error:", error);

    return res.status(500).json({
      message: "Unable to fetch users.",
    });
  }
};

// GET FOLLOWERS OR FOLLOWING LIST
export const getFollowList = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;
    const currentUserId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid user ID.",
      });
    }

    if (!["followers", "following"].includes(type)) {
      return res.status(400).json({
        message: "Invalid follow list type.",
      });
    }

    const targetUser = await User.findById(id).select("followers following");

    if (!targetUser) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    // CHECK WHETHER VIEWER AND PROFILE OWNER HAVE BLOCKED EACH OTHER
    if (String(id) !== String(currentUserId)) {
      const blocked = await isBlockedBetweenUsers(currentUserId, id);

      if (blocked) {
        return res.status(404).json({
          message: "User not found.",
        });
      }
    }

    const userIds = targetUser[type] || [];

    const currentUser =
      await User.findById(currentUserId).select("blockedUsers");

    const blockedIds = currentUser?.blockedUsers || [];

    // EXCLUDE USERS BLOCKED BY THE VIEWER OR USERS WHO BLOCKED THE VIEWER
    const users = await User.find({
      _id: {
        $in: userIds,
        $nin: blockedIds,
      },
      blockedUsers: {
        $ne: currentUserId,
      },
    }).select("_id username fullName profilePicture");

    return res.status(200).json({
      users,
      count: users.length,
    });
  } catch (error) {
    console.error("Get follow list error:", error);

    return res.status(500).json({
      message: "Unable to fetch follow list.",
    });
  }
};

// GET OTHER USER PROFILE
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid user ID.",
      });
    }

    if (id.toString() === currentUserId.toString()) {
      return res.status(400).json({
        message: "Use your own profile endpoint.",
      });
    }

    const user = await User.findById(id).select("-password -blockedUsers");

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    const blocked = await isBlockedBetweenUsers(currentUserId, id);

    if (blocked) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    return res.status(200).json({
      user,
    });
  } catch (error) {
    console.error("Get user profile error:", error);

    return res.status(500).json({
      message: "Unable to fetch user profile.",
    });
  }
};
