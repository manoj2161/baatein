import User from "../models/User.js";

// GET LOGGED-IN USER PROFILE
export const getProfile = async (req, res) => {
  try {
    return res.status(200).json({
      user: req.user,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to fetch profile",
    });
  }
};

// UPDATE PROFILE
export const updateProfile = async (req, res) => {
  try {
    const { username, bio, profilePicture } = req.body;

    const updates = {};

    if (username !== undefined) {
      const existingUser = await User.findOne({
        username,
        _id: { $ne: req.user._id },
      });

      if (existingUser) {
        return res.status(409).json({
          message: "Username already taken",
        });
      }

      updates.username = username;
    }

    if (bio !== undefined) {
      updates.bio = bio;
    }

    if (profilePicture !== undefined) {
      updates.profilePicture = profilePicture;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true },
    ).select("-password");

    return res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to update profile",
    });
  }
};

// GET ALL USERS
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({
      _id: { $ne: req.user._id },
    })
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      users,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to fetch users",
    });
  }
};

// GET OTHER USER PROFILE
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      user,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to fetch user profile",
    });
  }
};
