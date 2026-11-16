import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

import {
  createStory,
  getStories,
  deleteStory,
} from "../controllers/storyController.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", upload.single("media"), createStory);

router.get("/", getStories);

router.delete("/:storyId", deleteStory);

export default router;
