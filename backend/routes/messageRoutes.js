import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

import {
  createConversation,
  getConversations,
  getArchivedConversations,
  archiveConversation,
  unarchiveConversation,
  deleteConversation,
  getMessages,
  sendMessage,
  markMessagesAsRead,
  deleteMessagesForEveryone,
  deleteMessagesForMe,
} from "../controllers/messageController.js";

const router = express.Router();

router.use(authMiddleware);

// Conversations
router.post("/conversation", createConversation);
router.get("/conversations", getConversations);
router.get("/archived", getArchivedConversations);

// Read receipts
router.patch("/:conversationId/read", markMessagesAsRead);

// Archive and unarchive
router.patch("/:conversationId/archive", archiveConversation);
router.patch("/:conversationId/unarchive", unarchiveConversation);

// Message deletion
router.delete("/:conversationId/messages/everyone", deleteMessagesForEveryone);

router.delete("/:conversationId/messages/me", deleteMessagesForMe);

// Conversation deletion
router.delete("/:conversationId", deleteConversation);

// Get messages
router.get("/:conversationId", getMessages);

// Send text, image, or video message
router.post("/:conversationId", upload.single("media"), sendMessage);

export default router;
