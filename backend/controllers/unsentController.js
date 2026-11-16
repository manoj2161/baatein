import mongoose from "mongoose";
import Unsent from "../models/Unsent.js";
import UnsentReply from "../models/UnsentReply.js";
import User from "../models/User.js";

// CHECK WHETHER TWO USERS HAVE BLOCKED EACH OTHER
const isBlockedBetweenUsers = async (userId1, userId2) => {
  const users = await User.find({
    _id: { $in: [userId1, userId2] },
  }).select("_id blockedUsers");

  if (users.length !== 2) return true;

  const firstUser = users.find(
    (user) => user._id.toString() === userId1.toString(),
  );

  const secondUser = users.find(
    (user) => user._id.toString() === userId2.toString(),
  );

  return (
    firstUser.blockedUsers.some((id) => id.toString() === userId2.toString()) ||
    secondUser.blockedUsers.some((id) => id.toString() === userId1.toString())
  );
};

// CHECK WHETHER A USER CAN ACCESS AN UNSENT MESSAGE
const canAccessUnsent = async (unsent, currentUserId) => {
  const authorId = unsent.author._id || unsent.author;

  if (authorId.toString() === currentUserId.toString()) {
    return { allowed: true };
  }

  const blocked = await isBlockedBetweenUsers(currentUserId, authorId);

  if (blocked) {
    return { allowed: false, reason: "blocked" };
  }

  if (unsent.visibility === "followers") {
    const author = await User.findById(authorId).select("followers");

    const isFollower = author?.followers.some(
      (id) => id.toString() === currentUserId.toString(),
    );

    if (!isFollower) {
      return { allowed: false, reason: "followers" };
    }
  }

  return { allowed: true };
};

// FORMAT MESSAGE WITHOUT EXPOSING PRIVATE USER INFORMATION
const formatUnsent = (unsent, currentUserId) => {
  const isAnonymous = unsent.visibility === "anonymous";

  const author = unsent.author;

  const reactions = unsent.reactions || [];

  const isReacted = reactions.some((reaction) => {
    const reactionUserId = reaction.user?._id || reaction.user;

    return reactionUserId?.toString() === currentUserId.toString();
  });

  let formattedAuthor = {
    username: "Anonymous",
    fullName: "Anonymous",
    profilePicture: "",
  };

  if (!isAnonymous && author && typeof author === "object") {
    formattedAuthor = {
      _id: author._id,
      username: author.username || "",
      fullName: author.fullName || "",
      profilePicture: author.profilePicture || "",
    };
  }

  return {
    _id: unsent._id,
    content: unsent.content,
    category: unsent.category,
    visibility: unsent.visibility,
    author: formattedAuthor,
    reactionCount: reactions.length,
    replyCount: unsent.replyCount || 0,
    isReacted,
    isAnonymous,
    createdAt: unsent.createdAt,
    updatedAt: unsent.updatedAt,
  };
};

// FORMAT ANONYMOUS REPLY
const formatUnsentReply = (reply) => {
  return {
    _id: reply._id,
    content: reply.content,
    author: {
      username: "Anonymous",
      fullName: "Anonymous",
      profilePicture: "",
    },
    isAnonymous: true,
    createdAt: reply.createdAt,
    updatedAt: reply.updatedAt,
  };
};

// CREATE UNSENT MESSAGE
export const createUnsent = async (req, res) => {
  try {
    const { content, category, visibility = "anonymous" } = req.body;

    const allowedCategories = [
      "To Someone",
      "To My Past",
      "To My Future",
      "An Apology",
      "A Thank You",
      "A Goodbye",
      "A Dream",
      "A Secret",
    ];

    if (typeof content !== "string" || !content.trim()) {
      return res.status(400).json({
        message: "Please write something first.",
      });
    }

    if (content.trim().length > 5000) {
      return res.status(400).json({
        message: "Message cannot exceed 5000 characters.",
      });
    }

    if (!allowedCategories.includes(category)) {
      return res.status(400).json({
        message: "Invalid message category.",
      });
    }

    if (!["anonymous", "followers", "public"].includes(visibility)) {
      return res.status(400).json({
        message: "Invalid visibility option.",
      });
    }

    const unsent = await Unsent.create({
      author: req.user._id,
      content: content.trim(),
      category,
      visibility,
    });

    await unsent.populate("author", "username fullName profilePicture");

    return res.status(201).json({
      message: "Your Unsent message was published.",
      unsent: formatUnsent(unsent, req.user._id),
    });
  } catch (error) {
    console.error("Create Unsent error:", error);

    return res.status(500).json({
      message: "Unable to publish your message.",
    });
  }
};

// GET UNSENT FEED
export const getUnsentFeed = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const currentUser = await User.findById(currentUserId).select(
      "following blockedUsers",
    );

    if (!currentUser) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    const blockedByUsers = await User.find({
      blockedUsers: currentUserId,
    }).distinct("_id");

    const excludedIds = [...currentUser.blockedUsers, ...blockedByUsers];

    const followedIds = currentUser.following || [];

    const unsentMessages = await Unsent.find({
      author: { $nin: excludedIds },
      $or: [
        { visibility: "anonymous" },
        { visibility: "public" },
        {
          visibility: "followers",
          author: { $in: followedIds },
        },
      ],
    })
      .populate("author", "username fullName profilePicture")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const formattedMessages = unsentMessages.map((unsent) =>
      formatUnsent(unsent, currentUserId),
    );

    return res.status(200).json({
      unsent: formattedMessages,
      count: formattedMessages.length,
    });
  } catch (error) {
    console.error("Get Unsent feed error:", error);

    return res.status(500).json({
      message: "Unable to load Unsent messages.",
    });
  }
};

// GET MY UNSENT MESSAGES
export const getMyUnsent = async (req, res) => {
  try {
    const unsentMessages = await Unsent.find({
      author: req.user._id,
    })
      .populate("author", "username fullName profilePicture")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      unsent: unsentMessages.map((unsent) =>
        formatUnsent(unsent, req.user._id),
      ),
    });
  } catch (error) {
    console.error("Get my Unsent error:", error);

    return res.status(500).json({
      message: "Unable to load your messages.",
    });
  }
};

// TOGGLE "I FELT THIS TOO" REACTION
export const toggleUnsentReaction = async (req, res) => {
  try {
    const { unsentId } = req.params;
    const currentUserId = req.user._id;

    if (!mongoose.isValidObjectId(unsentId)) {
      return res.status(400).json({
        message: "Invalid message ID.",
      });
    }

    const unsent = await Unsent.findById(unsentId);

    if (!unsent) {
      return res.status(404).json({
        message: "Message not found.",
      });
    }

    const access = await canAccessUnsent(unsent, currentUserId);

    if (!access.allowed) {
      return res.status(access.reason === "blocked" ? 404 : 403).json({
        message:
          access.reason === "blocked"
            ? "Message not found."
            : "You cannot interact with this message.",
      });
    }

    const existingReaction = unsent.reactions.find(
      (reaction) => reaction.user.toString() === currentUserId.toString(),
    );

    if (existingReaction) {
      unsent.reactions = unsent.reactions.filter(
        (reaction) => reaction.user.toString() !== currentUserId.toString(),
      );
    } else {
      unsent.reactions.push({
        user: currentUserId,
        type: "felt",
      });
    }

    await unsent.save();

    return res.status(200).json({
      message: existingReaction ? "Reaction removed." : "You felt this too.",
      isReacted: !existingReaction,
      reactionCount: unsent.reactions.length,
    });
  } catch (error) {
    console.error("Toggle Unsent reaction error:", error);

    return res.status(500).json({
      message: "Unable to update reaction.",
    });
  }
};

// CREATE ANONYMOUS REPLY
export const createUnsentReply = async (req, res) => {
  try {
    const { unsentId } = req.params;
    const { content } = req.body;
    const currentUserId = req.user._id;

    if (!mongoose.isValidObjectId(unsentId)) {
      return res.status(400).json({
        message: "Invalid message ID.",
      });
    }

    if (typeof content !== "string" || !content.trim()) {
      return res.status(400).json({
        message: "Please write a reply first.",
      });
    }

    if (content.trim().length > 1000) {
      return res.status(400).json({
        message: "Reply cannot exceed 1000 characters.",
      });
    }

    const unsent = await Unsent.findById(unsentId);

    if (!unsent) {
      return res.status(404).json({
        message: "Message not found.",
      });
    }

    const access = await canAccessUnsent(unsent, currentUserId);

    if (!access.allowed) {
      return res.status(access.reason === "blocked" ? 404 : 403).json({
        message:
          access.reason === "blocked"
            ? "Message not found."
            : "You cannot reply to this message.",
      });
    }

    const reply = await UnsentReply.create({
      unsent: unsentId,
      author: currentUserId,
      content: content.trim(),
      isAnonymous: true,
    });

    await Unsent.updateOne({ _id: unsentId }, { $inc: { replyCount: 1 } });

    return res.status(201).json({
      message: "Your anonymous reply was published.",
      reply: formatUnsentReply(reply),
      replyCount: (unsent.replyCount || 0) + 1,
    });
  } catch (error) {
    console.error("Create Unsent reply error:", error);

    return res.status(500).json({
      message: "Unable to publish your reply.",
    });
  }
};

// GET REPLIES FOR AN UNSENT MESSAGE
export const getUnsentReplies = async (req, res) => {
  try {
    const { unsentId } = req.params;
    const currentUserId = req.user._id;

    if (!mongoose.isValidObjectId(unsentId)) {
      return res.status(400).json({
        message: "Invalid message ID.",
      });
    }

    const unsent = await Unsent.findById(unsentId);

    if (!unsent) {
      return res.status(404).json({
        message: "Message not found.",
      });
    }

    const access = await canAccessUnsent(unsent, currentUserId);

    if (!access.allowed) {
      return res.status(access.reason === "blocked" ? 404 : 403).json({
        message:
          access.reason === "blocked"
            ? "Message not found."
            : "You cannot view replies to this message.",
      });
    }

    const replies = await UnsentReply.find({
      unsent: unsentId,
    })
      .sort({ createdAt: 1 })
      .lean();

    return res.status(200).json({
      replies: replies.map(formatUnsentReply),
      count: replies.length,
    });
  } catch (error) {
    console.error("Get Unsent replies error:", error);

    return res.status(500).json({
      message: "Unable to load replies.",
    });
  }
};

// DELETE YOUR OWN ANONYMOUS REPLY
export const deleteUnsentReply = async (req, res) => {
  try {
    const { unsentId, replyId } = req.params;
    const currentUserId = req.user._id;

    if (
      !mongoose.isValidObjectId(unsentId) ||
      !mongoose.isValidObjectId(replyId)
    ) {
      return res.status(400).json({
        message: "Invalid message or reply ID.",
      });
    }

    const reply = await UnsentReply.findOneAndDelete({
      _id: replyId,
      unsent: unsentId,
      author: currentUserId,
    });

    if (!reply) {
      return res.status(404).json({
        message: "Reply not found or you are not allowed to delete it.",
      });
    }

    await Unsent.updateOne(
      { _id: unsentId, replyCount: { $gt: 0 } },
      { $inc: { replyCount: -1 } },
    );

    return res.status(200).json({
      message: "Your reply was deleted.",
    });
  } catch (error) {
    console.error("Delete Unsent reply error:", error);

    return res.status(500).json({
      message: "Unable to delete reply.",
    });
  }
};

// DELETE MY UNSENT MESSAGE
export const deleteUnsent = async (req, res) => {
  try {
    const { unsentId } = req.params;

    if (!mongoose.isValidObjectId(unsentId)) {
      return res.status(400).json({
        message: "Invalid message ID.",
      });
    }

    const unsent = await Unsent.findOneAndDelete({
      _id: unsentId,
      author: req.user._id,
    });

    if (!unsent) {
      return res.status(404).json({
        message: "Message not found or you are not allowed to delete it.",
      });
    }

    // Remove all replies belonging to this message.
    await UnsentReply.deleteMany({
      unsent: unsentId,
    });

    return res.status(200).json({
      message: "Unsent message deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Unsent error:", error);

    return res.status(500).json({
      message: "Unable to delete message.",
    });
  }
};
