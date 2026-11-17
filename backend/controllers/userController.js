import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

import User from "../models/User.js";
import Post from "../models/Post.js";
import Story from "../models/Story.js";
import Notification from "../models/Notification.js";
import Unsent from "../models/Unsent.js";
import UnsentReply from "../models/UnsentReply.js";
import cloudinary from "../config/cloudinary.js";

// ---------------------------------------------
// HELPERS
// ---------------------------------------------

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

const isBlockedBetweenUsers = async (userId1, userId2) => {
  const [user1, user2] = await Promise.all([
    User.findById(userId1).select("blockedUsers isDeleted"),
    User.findById(userId2).select("blockedUsers isDeleted"),
  ]);

  if (!user1 || !user2 || user1.isDeleted || user2.isDeleted) {
    return true;
  }

  const user1BlocksUser2 = user1.blockedUsers?.some(
    (id) => id.toString() === userId2.toString(),
  );

  const user2BlocksUser1 = user2.blockedUsers?.some(
    (id) => id.toString() === userId1.toString(),
  );

  return user1BlocksUser2 || user2BlocksUser1;
};

const getFrontendUrl = () =>
  (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");

const getBackendUrl = () =>
  (process.env.BACKEND_URL || "http://localhost:5000").replace(/\/$/, "");

const getCloudinaryPublicId = (imageUrl) => {
  if (!imageUrl) return null;

  try {
    const uploadPart = imageUrl.split("/upload/")[1];

    if (!uploadPart) return null;

    const parts = uploadPart.split("/");
    const versionIndex = parts.findIndex((part) => /^v\d+$/.test(part));

    const pathParts = versionIndex >= 0 ? parts.slice(versionIndex + 1) : parts;

    if (!pathParts.length) return null;

    const lastPart = pathParts[pathParts.length - 1];
    pathParts[pathParts.length - 1] = lastPart.replace(/\.[^.]+$/, "");

    return pathParts.join("/");
  } catch {
    return null;
  }
};

const sendBrevoEmail = async ({ email, subject, htmlContent }) => {
  if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL) {
    throw new Error("Brevo email configuration is missing.");
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": process.env.BREVO_API_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: process.env.BREVO_SENDER_NAME || "Baatein",
        email: process.env.BREVO_SENDER_EMAIL,
      },
      to: [{ email }],
      subject,
      htmlContent,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Brevo error:", errorText);
    throw new Error("Unable to send verification email.");
  }
};

// ---------------------------------------------
// GET LOGGED-IN USER PROFILE
// ---------------------------------------------

export const getProfile = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.user._id,
      isDeleted: { $ne: true },
    }).select("-password -blockedUsers -emailChangeTokenHash");

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Get profile error:", error);

    return res.status(500).json({
      message: "Unable to fetch profile.",
    });
  }
};

// ---------------------------------------------
// CHECK USERNAME AVAILABILITY
// ---------------------------------------------

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
      isDeleted: { $ne: true },
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

// ---------------------------------------------
// UPDATE PROFILE
// ---------------------------------------------

export const updateProfile = async (req, res) => {
  try {
    const { username, fullName, bio, status } = req.body;
    const updates = {};

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
        isDeleted: { $ne: true },
      }).select("_id");

      if (existingUser) {
        return res.status(409).json({
          message: "This username is already taken.",
        });
      }

      updates.username = normalizedUsername;
    }

    if (fullName !== undefined) {
      const normalizedFullName = fullName.trim();

      if (normalizedFullName.length > 50) {
        return res.status(400).json({
          message: "Full name cannot exceed 50 characters.",
        });
      }

      updates.fullName = normalizedFullName;
    }

    if (bio !== undefined) {
      const normalizedBio = bio.trim();

      if (normalizedBio.length > 150) {
        return res.status(400).json({
          message: "Bio cannot exceed 150 characters.",
        });
      }

      updates.bio = normalizedBio;
    }

    if (status !== undefined) {
      const normalizedStatus = status.trim();

      if (normalizedStatus.length > 60) {
        return res.status(400).json({
          message: "Status cannot exceed 60 characters.",
        });
      }

      updates.status = normalizedStatus;
    }

    const updatedUser = await User.findOneAndUpdate(
      {
        _id: req.user._id,
        isDeleted: { $ne: true },
      },
      { $set: updates },
      {
        new: true,
        runValidators: true,
      },
    ).select("-password -blockedUsers -emailChangeTokenHash");

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

// ---------------------------------------------
// UPLOAD PROFILE PICTURE
// ---------------------------------------------

export const updateProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Please select a profile picture.",
      });
    }

    const uploadedImage = await uploadProfileImage(req.file);

    const updatedUser = await User.findOneAndUpdate(
      {
        _id: req.user._id,
        isDeleted: { $ne: true },
      },
      {
        $set: {
          profilePicture: uploadedImage.secure_url,
        },
      },
      { new: true },
    ).select("-password -blockedUsers -emailChangeTokenHash");

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

// ---------------------------------------------
// REMOVE PROFILE PICTURE
// ---------------------------------------------

export const removeProfilePicture = async (req, res) => {
  try {
    const updatedUser = await User.findOneAndUpdate(
      {
        _id: req.user._id,
        isDeleted: { $ne: true },
      },
      {
        $set: { profilePicture: "" },
      },
      { new: true },
    ).select("-password -blockedUsers -emailChangeTokenHash");

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

// ---------------------------------------------
// REQUEST EMAIL CHANGE
// ---------------------------------------------

export const requestEmailChange = async (req, res) => {
  try {
    const { email, currentPassword } = req.body;

    if (!email || !currentPassword) {
      return res.status(400).json({
        message: "New email and current password are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    const user = await User.findOne({
      _id: req.user._id,
      isDeleted: { $ne: true },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!passwordMatches) {
      return res.status(400).json({
        message: "Your current password is incorrect.",
      });
    }

    if (normalizedEmail === user.email) {
      return res.status(400).json({
        message: "This is already your current email address.",
      });
    }

    const existingUser = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: user._id },
      isDeleted: { $ne: true },
    }).select("_id");

    if (existingUser) {
      return res.status(409).json({
        message: "This email address is already in use.",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    user.pendingEmail = normalizedEmail;
    user.emailChangeTokenHash = tokenHash;
    user.emailChangeExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await user.save();

    const verificationLink = `${getBackendUrl()}/api/users/settings/verify-email/${token}`;

    try {
      await sendBrevoEmail({
        email: normalizedEmail,
        subject: "Verify your new Baatein email address",
        htmlContent: `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;color:#222">
            <h2>Verify your new email address</h2>
            <p>You requested to change the email address associated with your Baatein account.</p>
            <p>Click the button below to confirm this change.</p>
            <a href="${verificationLink}" style="display:inline-block;padding:12px 22px;background:#315efb;color:#fff;text-decoration:none;border-radius:8px">
              Verify email address
            </a>
            <p>This link expires in 15 minutes.</p>
            <p>If you did not request this change, you can ignore this email.</p>
          </div>
        `,
      });
    } catch (emailError) {
      user.pendingEmail = null;
      user.emailChangeTokenHash = null;
      user.emailChangeExpiresAt = null;
      await user.save();

      throw emailError;
    }

    return res.status(200).json({
      message: "A verification link has been sent to your new email address.",
      pendingEmail: normalizedEmail,
    });
  } catch (error) {
    console.error("Request email change error:", error);

    return res.status(500).json({
      message: error.message || "Unable to send the verification email.",
    });
  }
};

// ---------------------------------------------
// VERIFY EMAIL CHANGE
// Public route: user opens the link from their email.
// ---------------------------------------------

export const verifyEmailChange = async (req, res) => {
  const verificationUrl = (status) =>
    `${getFrontendUrl()}/email-verification?status=${status}`;

  try {
    const { token } = req.params;

    if (!token) {
      return res.redirect(verificationUrl("invalid"));
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      emailChangeTokenHash: tokenHash,
      emailChangeExpiresAt: { $gt: new Date() },
      isDeleted: { $ne: true },
    });

    if (!user || !user.pendingEmail) {
      return res.redirect(verificationUrl("invalid"));
    }

    const existingUser = await User.findOne({
      email: user.pendingEmail,
      _id: { $ne: user._id },
      isDeleted: { $ne: true },
    }).select("_id");

    if (existingUser) {
      return res.redirect(verificationUrl("invalid"));
    }

    user.email = user.pendingEmail;
    user.pendingEmail = null;
    user.emailChangeTokenHash = null;
    user.emailChangeExpiresAt = null;

    await user.save();

    return res.redirect(verificationUrl("success"));
  } catch (error) {
    console.error("Verify email change error:", error);

    return res.redirect(verificationUrl("invalid"));
  }
};
// ---------------------------------------------
// UPDATE OR REMOVE PHONE NUMBER
// ---------------------------------------------

export const updatePhoneNumber = async (req, res) => {
  try {
    const phoneNumber = (req.body.phoneNumber || "").trim();

    if (phoneNumber) {
      const phoneRegex = /^\+?[0-9]{7,15}$/;

      if (!phoneRegex.test(phoneNumber)) {
        return res.status(400).json({
          message:
            "Enter a valid phone number containing 7 to 15 digits. You may include a leading +.",
        });
      }
    }

    const user = await User.findOneAndUpdate(
      {
        _id: req.user._id,
        isDeleted: { $ne: true },
      },
      {
        $set: { phoneNumber },
      },
      {
        new: true,
        runValidators: true,
      },
    ).select("-password -blockedUsers -emailChangeTokenHash");

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    return res.status(200).json({
      message: phoneNumber
        ? "Phone number updated successfully. It has not been SMS-verified."
        : "Phone number removed successfully.",
      user,
    });
  } catch (error) {
    console.error("Update phone number error:", error);

    return res.status(500).json({
      message: "Unable to update phone number.",
    });
  }
};

// ---------------------------------------------
// DELETE ACCOUNT
// Keeps conversations and messages.
// Anonymizes the user record so message references remain valid.
// ---------------------------------------------

export const deleteAccount = async (req, res) => {
  try {
    const { password, confirmation } = req.body;

    if (!password || confirmation !== "DELETE") {
      return res.status(400).json({
        message: 'Enter your password and type "DELETE" to confirm.',
      });
    }

    const user = await User.findById(req.user._id);

    if (!user || user.isDeleted) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(400).json({
        message: "Your password is incorrect.",
      });
    }

    const userId = user._id;
    const userIdString = userId.toString();

    // Collect the user's posts and stories before deleting them.
    const [posts, stories, unsentMessages] = await Promise.all([
      Post.find({ user: userId }).select("publicId mediaType"),
      Story.find({ user: userId }).select("publicId mediaType"),
      Unsent.find({ author: userId }).select("_id"),
    ]);

    const unsentIds = unsentMessages.map((item) => item._id);

    // Delete Cloudinary media without allowing an asset failure
    // to prevent the account deletion process.
    const cloudinaryDeletions = [];

    for (const post of posts) {
      if (post.publicId) {
        cloudinaryDeletions.push(
          cloudinary.uploader.destroy(post.publicId, {
            resource_type: post.mediaType === "video" ? "video" : "image",
          }),
        );
      }
    }

    for (const story of stories) {
      if (story.publicId) {
        cloudinaryDeletions.push(
          cloudinary.uploader.destroy(story.publicId, {
            resource_type: story.mediaType === "video" ? "video" : "image",
          }),
        );
      }
    }

    const profilePicturePublicId = getCloudinaryPublicId(user.profilePicture);

    if (profilePicturePublicId) {
      cloudinaryDeletions.push(
        cloudinary.uploader.destroy(profilePicturePublicId, {
          resource_type: "image",
        }),
      );
    }

    const cloudinaryResults = await Promise.allSettled(cloudinaryDeletions);

    cloudinaryResults.forEach((result) => {
      if (result.status === "rejected") {
        console.error(
          "Cloudinary cleanup error during account deletion:",
          result.reason,
        );
      }
    });

    // Delete the user's posts.
    await Post.deleteMany({ user: userId });

    // Remove the user's likes and comments from other posts.
    await Post.updateMany(
      { user: { $ne: userId } },
      {
        $pull: {
          likes: userId,
          comments: { user: userId },
        },
      },
    );

    // Delete the user's stories.
    await Story.deleteMany({ user: userId });

    // Remove the user from other stories' viewer lists.
    await Story.updateMany(
      {},
      {
        $pull: {
          viewers: { user: userId },
        },
      },
    );

    // Delete replies belonging to the user's own Unsent messages,
    // and replies authored by the user on other messages.
    await UnsentReply.deleteMany({
      $or: [{ unsent: { $in: unsentIds } }, { author: userId }],
    });

    // Delete the user's own Unsent messages.
    await Unsent.deleteMany({ author: userId });

    // Remove the user's reactions from other Unsent messages.
    await Unsent.updateMany(
      {},
      {
        $pull: {
          reactions: { user: userId },
        },
      },
    );

    // Recalculate reply counts to keep remaining Unsent messages accurate.
    const replyCounts = await UnsentReply.aggregate([
      {
        $group: {
          _id: "$unsent",
          count: { $sum: 1 },
        },
      },
    ]);

    const replyCountMap = new Map(
      replyCounts.map((item) => [item._id.toString(), item.count]),
    );

    const remainingUnsent = await Unsent.find().select("_id replyCount");

    if (remainingUnsent.length) {
      const bulkOperations = remainingUnsent.map((item) => ({
        updateOne: {
          filter: { _id: item._id },
          update: {
            $set: {
              replyCount: replyCountMap.get(item._id.toString()) || 0,
            },
          },
        },
      }));

      await Unsent.bulkWrite(bulkOperations);
    }

    // Remove notifications involving this account.
    await Notification.deleteMany({
      $or: [{ recipient: userId }, { sender: userId }],
    });

    // Remove this user from every other user's relationships and block lists.
    await User.updateMany(
      { _id: { $ne: userId } },
      {
        $pull: {
          followers: userId,
          following: userId,
          blockedUsers: userId,
        },
      },
    );

    // Keep the User document because conversations and messages
    // still reference its ObjectId.
    // Reserve unique username/email values for the anonymized record.
    const deletedIdentifier = `deleted_${userIdString}`;

    user.username = deletedIdentifier;
    user.email = `${deletedIdentifier}@deleted.baatein.invalid`;
    user.password = crypto.randomBytes(48).toString("hex");

    user.fullName = "Deleted Account";
    user.profilePicture = "";
    user.bio = "";
    user.status = "";
    user.phoneNumber = "";

    user.pendingEmail = null;
    user.emailChangeTokenHash = null;
    user.emailChangeExpiresAt = null;

    user.followers = [];
    user.following = [];
    user.blockedUsers = [];

    user.lastSeen = null;
    user.isDeleted = true;
    user.deletedAt = new Date();

    await user.save();

    // Clear the authentication cookie.
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    return res.status(200).json({
      message: "Your account has been permanently deleted.",
    });
  } catch (error) {
    console.error("Delete account error:", error);

    return res.status(500).json({
      message: "Unable to delete your account. Please try again.",
    });
  }
};

// ---------------------------------------------
// GET ALL USERS
// ---------------------------------------------

export const getUsers = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const currentUser = await User.findOne({
      _id: currentUserId,
      isDeleted: { $ne: true },
    }).select("blockedUsers");

    if (!currentUser) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    const blockedUserIds = currentUser.blockedUsers || [];

    const users = await User.find({
      isDeleted: { $ne: true },
      _id: {
        $ne: currentUserId,
        $nin: blockedUserIds,
      },
      blockedUsers: {
        $ne: currentUserId,
      },
    })
      .select("-password -blockedUsers -emailChangeTokenHash")
      .sort({ createdAt: -1 });

    return res.status(200).json({ users });
  } catch (error) {
    console.error("Get users error:", error);

    return res.status(500).json({
      message: "Unable to fetch users.",
    });
  }
};

// ---------------------------------------------
// GET FOLLOWERS OR FOLLOWING LIST
// ---------------------------------------------

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

    const targetUser = await User.findOne({
      _id: id,
      isDeleted: { $ne: true },
    }).select("followers following");

    if (!targetUser) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

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

    const users = await User.find({
      isDeleted: { $ne: true },
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

// ---------------------------------------------
// GET OTHER USER PROFILE
// ---------------------------------------------

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

    const user = await User.findOne({
      _id: id,
      isDeleted: { $ne: true },
    }).select("-password -blockedUsers -emailChangeTokenHash");

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

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Get user profile error:", error);

    return res.status(500).json({
      message: "Unable to fetch user profile.",
    });
  }
};
