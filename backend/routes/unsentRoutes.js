import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";

import {
  createUnsent,
  getUnsentFeed,
  getMyUnsent,
  toggleUnsentReaction,
  deleteUnsent,
  createUnsentReply,
  getUnsentReplies,
  deleteUnsentReply,
} from "../controllers/unsentController.js";

const router = express.Router();

router.use(authMiddleware);

// UNSENT MESSAGES
router.post("/", createUnsent);

router.get("/feed", getUnsentFeed);

router.get("/my", getMyUnsent);

router.put("/:unsentId/reaction", toggleUnsentReaction);

router.delete("/:unsentId", deleteUnsent);

// UNSENT REPLIES
router.post("/:unsentId/replies", createUnsentReply);

router.get("/:unsentId/replies", getUnsentReplies);

router.delete("/:unsentId/replies/:replyId", deleteUnsentReply);

export default router;
