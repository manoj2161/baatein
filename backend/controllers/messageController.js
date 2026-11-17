import mongoose from "mongoose";

import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";

// UPLOAD MESSAGE MEDIA TO CLOUDINARY
const uploadMessageMedia = (file) => {
  return new Promise((resolve, reject) => {
    const resourceType = file.mimetype.startsWith("video/") ? "video" : "image";

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "baatein/messages",
        resource_type: resourceType,
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

  if (!user1 || !user2) {
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

// GET OTHER PARTICIPANT FROM CONVERSATION
const getOtherParticipantId = (conversation, currentUserId) => {
  return conversation.participants.find(
    (id) => id.toString() !== currentUserId.toString(),
  );
};

// CREATE OR GET CONVERSATION
export const createConversation = async (req, res) => {
  try {
    const { userId } = req.body || {};
    const currentUserId = req.user._id;

    if (
      !userId ||
      !mongoose.Types.ObjectId.isValid(userId) ||
      userId === currentUserId.toString()
    ) {
      return res.status(400).json({
        message: "Invalid user",
      });
    }

    const otherUser = await User.findById(userId);

    if (!otherUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const blocked = await isBlockedBetweenUsers(currentUserId, userId);

    if (blocked) {
      return res.status(403).json({
        message: "You cannot start a conversation with this user.",
      });
    }

    let conversation = await Conversation.findOne({
      participants: {
        $all: [currentUserId, userId],
        $size: 2,
      },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [currentUserId, userId],
      });
    }

    await Conversation.updateOne(
      { _id: conversation._id },
      {
        $pull: {
          archivedBy: currentUserId,
          deletedBy: currentUserId,
        },
      },
    );

    conversation = await Conversation.findById(conversation._id).populate(
      "participants",
      "username profilePicture lastSeen",
    );

    return res.status(200).json({
      conversation,
    });
  } catch (error) {
    console.error("Create conversation error:", error);

    return res.status(500).json({
      message: "Unable to create conversation",
    });
  }
};

// GET ACTIVE INBOX CONVERSATIONS
export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      participants: userId,
      archivedBy: { $ne: userId },
      deletedBy: { $ne: userId },
    })
      .populate("participants", "username profilePicture lastSeen")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    const conversationsWithUnreadCount = await Promise.all(
      conversations.map(async (conversation) => {
        const otherUserId = getOtherParticipantId(conversation, userId);

        const blocked = otherUserId
          ? await isBlockedBetweenUsers(userId, otherUserId)
          : false;

        const unreadCount = blocked
          ? 0
          : await Message.countDocuments({
              conversation: conversation._id,
              sender: { $ne: userId },
              isRead: false,
              deletedFor: { $ne: userId },
            });

        let conversationData = conversation.toObject();

        if (blocked) {
          conversationData.lastMessage = null;
        } else if (
          conversationData.lastMessage?.deletedFor?.some(
            (id) => String(id) === String(userId),
          )
        ) {
          const visibleLastMessage = await Message.findOne({
            conversation: conversation._id,
            deletedFor: { $ne: userId },
          }).sort({ createdAt: -1 });

          conversationData.lastMessage = visibleLastMessage;
        }

        return {
          ...conversationData,
          unreadCount,
          isBlocked: blocked,
        };
      }),
    );

    return res.status(200).json({
      conversations: conversationsWithUnreadCount,
    });
  } catch (error) {
    console.error("Get conversations error:", error);

    return res.status(500).json({
      message: "Unable to load conversations",
    });
  }
};

// GET ARCHIVED CONVERSATIONS
export const getArchivedConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      participants: userId,
      archivedBy: userId,
      deletedBy: { $ne: userId },
    })
      .populate("participants", "username profilePicture lastSeen")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    const conversationsWithUnreadCount = await Promise.all(
      conversations.map(async (conversation) => {
        const otherUserId = getOtherParticipantId(conversation, userId);

        const blocked = otherUserId
          ? await isBlockedBetweenUsers(userId, otherUserId)
          : false;

        const unreadCount = blocked
          ? 0
          : await Message.countDocuments({
              conversation: conversation._id,
              sender: { $ne: userId },
              isRead: false,
              deletedFor: { $ne: userId },
            });

        let conversationData = conversation.toObject();

        if (blocked) {
          conversationData.lastMessage = null;
        } else if (
          conversationData.lastMessage?.deletedFor?.some(
            (id) => String(id) === String(userId),
          )
        ) {
          const visibleLastMessage = await Message.findOne({
            conversation: conversation._id,
            deletedFor: { $ne: userId },
          }).sort({ createdAt: -1 });

          conversationData.lastMessage = visibleLastMessage;
        }

        return {
          ...conversationData,
          unreadCount,
          isBlocked: blocked,
        };
      }),
    );

    return res.status(200).json({
      conversations: conversationsWithUnreadCount,
    });
  } catch (error) {
    console.error("Get archived conversations error:", error);

    return res.status(500).json({
      message: "Unable to load conversations",
    });
  }
};

// ARCHIVE CONVERSATION
export const archiveConversation = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversation = await Conversation.findOneAndUpdate(
      {
        _id: req.params.conversationId,
        participants: userId,
      },
      {
        $addToSet: {
          archivedBy: userId,
        },
      },
      { new: true },
    );

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    return res.status(200).json({
      message: "Conversation archived",
    });
  } catch (error) {
    console.error("Archive conversation error:", error);

    return res.status(500).json({
      message: "Unable to archive conversation",
    });
  }
};

// UNARCHIVE CONVERSATION
export const unarchiveConversation = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversation = await Conversation.findOneAndUpdate(
      {
        _id: req.params.conversationId,
        participants: userId,
      },
      {
        $pull: {
          archivedBy: userId,
          deletedBy: userId,
        },
      },
      { new: true },
    );

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    return res.status(200).json({
      message: "Conversation restored",
    });
  } catch (error) {
    console.error("Unarchive conversation error:", error);

    return res.status(500).json({
      message: "Unable to restore conversation",
    });
  }
};

// DELETE CONVERSATION FOR CURRENT USER ONLY
export const deleteConversation = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversation = await Conversation.findOneAndUpdate(
      {
        _id: req.params.conversationId,
        participants: userId,
      },
      {
        $addToSet: {
          deletedBy: userId,
        },
        $pull: {
          archivedBy: userId,
        },
      },
      { new: true },
    );

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    return res.status(200).json({
      message: "Conversation deleted from your inbox",
    });
  } catch (error) {
    console.error("Delete conversation error:", error);

    return res.status(500).json({
      message: "Unable to delete conversation",
    });
  }
};

// GET CONVERSATION MESSAGES
export const getMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        message: "Invalid conversation ID",
      });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    const otherUserId = getOtherParticipantId(conversation, userId);
    const blocked = await isBlockedBetweenUsers(userId, otherUserId);

    if (blocked) {
      return res.status(403).json({
        message: "You cannot access this conversation.",
      });
    }

    const messages = await Message.find({
      conversation: conversation._id,
      deletedFor: { $ne: userId },
    })
      .populate("sender", "username profilePicture")
      .sort({ createdAt: -1 })
      .limit(200);

    messages.reverse();

    return res.status(200).json({
      messages,
    });
  } catch (error) {
    console.error("Get messages error:", error);

    return res.status(500).json({
      message: "Unable to load messages",
    });
  }
};

// SEND TEXT, IMAGE, OR VIDEO MESSAGE
export const sendMessage = async (req, res) => {
  try {
    const text = req.body?.text?.trim() || "";
    const file = req.file;

    const currentUserId = req.user._id;
    const { conversationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        message: "Invalid conversation ID",
      });
    }

    if (!text && !file) {
      return res.status(400).json({
        message: "Please enter a message or select a photo/video.",
      });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: currentUserId,
    });

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    const otherUserId = getOtherParticipantId(conversation, currentUserId);

    const blocked = await isBlockedBetweenUsers(currentUserId, otherUserId);

    if (blocked) {
      return res.status(403).json({
        message: "You cannot send messages to this user.",
      });
    }

    let mediaUrl = "";
    let mediaType = "none";

    if (file) {
      const uploadedMedia = await uploadMessageMedia(file);

      mediaUrl = uploadedMedia.secure_url;
      mediaType = file.mimetype.startsWith("video/") ? "video" : "image";
    }

    const newMessage = await Message.create({
      conversation: conversation._id,
      sender: currentUserId,
      text,
      mediaUrl,
      mediaType,
    });

    conversation.lastMessage = newMessage._id;

    // Restore the conversation in the sender's inbox.
    conversation.archivedBy = conversation.archivedBy.filter(
      (id) => id.toString() !== currentUserId.toString(),
    );

    conversation.deletedBy = conversation.deletedBy.filter(
      (id) => id.toString() !== currentUserId.toString(),
    );

    await conversation.save();

    await newMessage.populate("sender", "username profilePicture");

    const io = req.app.get("io");

    if (io) {
      conversation.participants.forEach((participantId) => {
        io.to(participantId.toString()).emit("newMessage", newMessage);
      });
    }

    return res.status(201).json({
      message: "Message sent successfully",
      newMessage,
    });
  } catch (error) {
    console.error("Send message error:", error);

    return res.status(500).json({
      message: "Unable to send message",
    });
  }
};

// DELETE SELECTED MESSAGES FOR EVERYONE
export const deleteMessagesForEveryone = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { messageIds } = req.body || {};
    const userId = req.user._id;

    if (
      !Array.isArray(messageIds) ||
      messageIds.length === 0 ||
      !messageIds.every((id) => mongoose.Types.ObjectId.isValid(id))
    ) {
      return res.status(400).json({
        message: "Please select valid messages",
      });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    const messages = await Message.find({
      _id: { $in: messageIds },
      conversation: conversationId,
      sender: userId,
      isDeletedForEveryone: false,
    });

    if (messages.length !== messageIds.length) {
      return res.status(400).json({
        message: "You can only delete your own messages for everyone",
      });
    }

    await Message.updateMany(
      {
        _id: { $in: messageIds },
        conversation: conversationId,
        sender: userId,
      },
      {
        $set: {
          text: "",
          mediaUrl: "",
          mediaType: "none",
          isDeletedForEveryone: true,
          deletedAt: new Date(),
        },
      },
    );

    const deletedMessages = await Message.find({
      _id: { $in: messageIds },
      conversation: conversationId,
    }).populate("sender", "username profilePicture");

    const io = req.app.get("io");

    if (io) {
      conversation.participants.forEach((participantId) => {
        io.to(participantId.toString()).emit("messagesDeleted", {
          conversationId: conversationId.toString(),
          messages: deletedMessages,
          messageIds: messageIds.map(String),
        });
      });
    }

    return res.status(200).json({
      message: "Messages deleted for everyone",
      messages: deletedMessages,
      messageIds: messageIds.map(String),
    });
  } catch (error) {
    console.error("Delete messages for everyone error:", error);

    return res.status(500).json({
      message: "Unable to delete messages",
    });
  }
};

// DELETE SELECTED MESSAGES FOR CURRENT USER
export const deleteMessagesForMe = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { messageIds } = req.body || {};
    const userId = req.user._id;

    if (
      !Array.isArray(messageIds) ||
      messageIds.length === 0 ||
      !messageIds.every((id) => mongoose.Types.ObjectId.isValid(id))
    ) {
      return res.status(400).json({
        message: "Please select valid messages",
      });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    const messages = await Message.find({
      _id: { $in: messageIds },
      conversation: conversationId,
    }).select("_id");

    if (messages.length !== messageIds.length) {
      return res.status(400).json({
        message: "One or more messages were not found",
      });
    }

    await Message.updateMany(
      {
        _id: { $in: messageIds },
        conversation: conversationId,
      },
      {
        $addToSet: {
          deletedFor: userId,
        },
      },
    );

    return res.status(200).json({
      message: "Messages deleted from your chat",
      messageIds: messageIds.map(String),
    });
  } catch (error) {
    console.error("Delete messages for me error:", error);

    return res.status(500).json({
      message: "Unable to delete messages",
    });
  }
};

// MARK RECEIVED MESSAGES AS READ
export const markMessagesAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        message: "Invalid conversation ID",
      });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    const otherUserId = getOtherParticipantId(conversation, userId);
    const blocked = await isBlockedBetweenUsers(userId, otherUserId);

    if (blocked) {
      return res.status(403).json({
        message: "You cannot access this conversation.",
      });
    }

    const unreadMessages = await Message.find({
      conversation: conversationId,
      sender: { $ne: userId },
      isRead: false,
      deletedFor: { $ne: userId },
    }).select("_id sender");

    if (unreadMessages.length === 0) {
      return res.status(200).json({
        message: "No unread messages",
        messageIds: [],
        unreadCount: 0,
      });
    }

    const messageIds = unreadMessages.map((message) => message._id.toString());

    await Message.updateMany(
      {
        _id: {
          $in: unreadMessages.map((message) => message._id),
        },
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      },
    );

    const io = req.app.get("io");

    if (io) {
      const senderIds = [
        ...new Set(unreadMessages.map((message) => message.sender.toString())),
      ];

      senderIds.forEach((senderId) => {
        io.to(senderId).emit("messagesSeen", {
          conversationId: conversationId.toString(),
          readerId: userId.toString(),
          messageIds,
        });
      });

      io.to(userId.toString()).emit("unreadCountUpdated", {
        conversationId: conversationId.toString(),
        unreadCount: 0,
      });
    }

    return res.status(200).json({
      message: "Messages marked as read",
      messageIds,
      unreadCount: 0,
    });
  } catch (error) {
    console.error("Mark messages as read error:", error);

    return res.status(500).json({
      message: "Unable to mark messages as read",
    });
  }
};
