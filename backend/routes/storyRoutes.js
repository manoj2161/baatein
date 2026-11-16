import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

import {
  createStory,
  getStories,
  deleteStory,
  viewStory,
  getStoryViewers,
} from "../controllers/storyController.js";

const router = express.Router();

router.use(authMiddleware);

// Create story
router.post("/", upload.single("media"), createStory);

// Get stories
router.get("/", getStories);

// Record a story view
router.post("/:storyId/view", viewStory);

// Get story viewers (owner only)
router.get("/:storyId/viewers", getStoryViewers);

// Delete story
router.delete("/:storyId", deleteStory);

export default router;
