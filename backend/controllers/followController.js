import User from "../models/User.js";
import createNotification from "../utils/createNotification.js";

// FOLLOW USER
export const followUser = async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user._id;

    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({
        message: "You cannot follow yourself.",
      });
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(targetUserId),
    ]);

    if (!targetUser || !currentUser) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    // CHECK BLOCK STATUS
    const blockedByCurrentUser = currentUser.blockedUsers?.some(
      (id) => id.toString() === targetUserId.toString(),
    );

    const blockedByTargetUser = targetUser.blockedUsers?.some(
      (id) => id.toString() === currentUserId.toString(),
    );

    if (blockedByCurrentUser || blockedByTargetUser) {
      return res.status(403).json({
        message: "You cannot follow this user.",
      });
    }

    const alreadyFollowing = currentUser.following.some(
      (id) => id.toString() === targetUserId.toString(),
    );

    if (alreadyFollowing) {
      return res.status(400).json({
        message: "Already following this user.",
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

    // CREATE AND SEND REAL-TIME NOTIFICATION
    createNotification({
      recipient: targetUserId,
      sender: currentUserId,
      type: "follow",
      message: "started following you",
      io: req.app.get("io"),
    }).catch((error) => {
      console.error("Notification error:", error);
    });

    return res.status(200).json({
      message: "User followed successfully.",
    });
  } catch (error) {
    console.error("Follow error:", error);

    return res.status(500).json({
      message: "Unable to follow user.",
    });
  }
};

// UNFOLLOW USER
export const unfollowUser = async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user._id;

    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({
        message: "You cannot unfollow yourself.",
      });
    }

    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    await Promise.all([
      User.findByIdAndUpdate(currentUserId, {
        $pull: { following: targetUserId },
      }),
      User.findByIdAndUpdate(targetUserId, {
        $pull: { followers: currentUserId },
      }),
    ]);

    return res.status(200).json({
      message: "User unfollowed successfully.",
    });
  } catch (error) {
    console.error("Unfollow error:", error);

    return res.status(500).json({
      message: "Unable to unfollow user.",
    });
  }
};

// GET USER FOLLOWERS
export const getFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate("followers", "username fullName profilePicture bio status")
      .select("followers");

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    return res.status(200).json({
      users: user.followers,
      count: user.followers.length,
    });
  } catch (error) {
    console.error("Get followers error:", error);

    return res.status(500).json({
      message: "Unable to fetch followers.",
    });
  }
};

// GET USER FOLLOWING
export const getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate("following", "username fullName profilePicture bio status")
      .select("following");

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    return res.status(200).json({
      users: user.following,
      count: user.following.length,
    });
  } catch (error) {
    console.error("Get following error:", error);

    return res.status(500).json({
      message: "Unable to fetch following.",
    });
  }
};
