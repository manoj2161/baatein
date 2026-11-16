import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

// CREATE OR GET CONVERSATION
export const createConversation = async (req, res) => {
  try {
    const { userId } = req.body;
    const currentUserId = req.user._id;

    if (
      !userId ||
      !mongoose.Types.ObjectId.isValid(userId) ||
      userId === currentUserId.toString()
    ) {
      return res.status(400).json({ message: "Invalid user" });
    }

    const otherUser = await User.findById(userId);

    if (!otherUser) {
      return res.status(404).json({ message: "User not found" });
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

    return res.status(200).json({ conversation });
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
        const unreadCount = await Message.countDocuments({
          conversation: conversation._id,
          sender: { $ne: userId },
          isRead: false,
          deletedFor: { $ne: userId },
        });

        let conversationData = conversation.toObject();

        // If the last message was hidden by this user, show the latest
        // message that is still visible to them in the inbox preview.
        if (
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
        const unreadCount = await Message.countDocuments({
          conversation: conversation._id,
          sender: { $ne: userId },
          isRead: false,
          deletedFor: { $ne: userId },
        });

        let conversationData = conversation.toObject();

        if (
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
        };
      }),
    );

    return res.status(200).json({
      conversations: conversationsWithUnreadCount,
    });
  } catch (error) {
    console.error("Get archived conversations error:", error);
    return res.status(500).json({
      message: "Unable to load archived conversations",
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
        $addToSet: { archivedBy: userId },
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
        $addToSet: { deletedBy: userId },
        $pull: { archivedBy: userId },
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

    const conversation = await Conversation.findOne({
      _id: req.params.conversationId,
      participants: userId,
    });

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
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

    return res.status(200).json({ messages });
  } catch (error) {
    console.error("Get messages error:", error);

    return res.status(500).json({
      message: "Unable to load messages",
    });
  }
};
// SEND MESSAGE
export const sendMessage = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        message: "Message cannot be empty",
      });
    }

    const conversation = await Conversation.findOne({
      _id: req.params.conversationId,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    const newMessage = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      text: text.trim(),
    });

    conversation.lastMessage = newMessage._id;

    // Restore the conversation for the sender only.
    conversation.archivedBy = conversation.archivedBy.filter(
      (id) => id.toString() !== req.user._id.toString(),
    );

    conversation.deletedBy = conversation.deletedBy.filter(
      (id) => id.toString() !== req.user._id.toString(),
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
      message: "Message sent",
      newMessage,
    });
  } catch (error) {
    console.error("Send message error:", error);
    return res.status(500).json({
      message: "Unable to send message",
    });
  }
};

// DELETE SELECTED MESSAGES FOR EVERYONE (SOFT DELETE)
// DELETE SELECTED MESSAGES FOR EVERYONE
export const deleteMessagesForEveryone = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { messageIds } = req.body;
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

    // Only allow deleting messages sent by the current user.
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
    const { messageIds } = req.body;
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

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
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
        _id: { $in: unreadMessages.map((message) => message._id) },
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
