import User from "../models/User.js";
import createNotification from "../utils/createNotification.js";

// FOLLOW USER
export const followUser = async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user._id;

    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({
        message: "You cannot follow yourself",
      });
    }

    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const alreadyFollowing = targetUser.followers.some(
      (id) => id.toString() === currentUserId.toString(),
    );

    if (alreadyFollowing) {
      return res.status(400).json({
        message: "Already following this user",
      });
    }

    await Promise.all([
      User.findByIdAndUpdate(currentUserId, {
        $addToSet: { following: targetUserId },
      }),
      User.findByIdAndUpdate(targetUserId, {
        $addToSet: { followers: currentUserId },
      }),
    ]);

    createNotification({
      recipient: targetUserId,
      sender: currentUserId,
      type: "follow",
      message: "started following you",
    }).catch((error) => console.error("Notification error:", error));

    return res.status(200).json({
      message: "User followed successfully",
    });
  } catch (error) {
    console.error("Follow error:", error);

    return res.status(500).json({
      message: "Unable to follow user",
    });
  }
};

// UNFOLLOW USER
export const unfollowUser = async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user._id;

    await Promise.all([
      User.findByIdAndUpdate(currentUserId, {
        $pull: { following: targetUserId },
      }),
      User.findByIdAndUpdate(targetUserId, {
        $pull: { followers: currentUserId },
      }),
    ]);

    return res.status(200).json({
      message: "User unfollowed successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to unfollow user",
    });
  }
};
