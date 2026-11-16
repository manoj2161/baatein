import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
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

router.post("/conversation", createConversation);
router.get("/conversations", getConversations);
router.get("/archived", getArchivedConversations);

router.patch("/:conversationId/read", markMessagesAsRead);
router.patch("/:conversationId/archive", archiveConversation);
router.patch("/:conversationId/unarchive", unarchiveConversation);
router.delete("/:conversationId/messages/everyone", deleteMessagesForEveryone);
router.delete("/:conversationId/messages/me", deleteMessagesForMe);
// Message deletion routes
router.delete("/:conversationId/messages/me", deleteMessagesForMe);
router.delete("/:conversationId/messages", deleteMessagesForEveryone);

// Conversation deletion route
router.delete("/:conversationId", deleteConversation);

router.get("/:conversationId", getMessages);
router.post("/:conversationId", sendMessage);

export default router;
