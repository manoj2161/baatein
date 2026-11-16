import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

import {
  createPost,
  getFeed,
  getUserPosts,
  toggleLike,
  addComment,
  deletePost,
} from "../controllers/postController.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", upload.single("media"), createPost);

router.get("/feed", getFeed);

router.get("/user/:userId", getUserPosts);

router.put("/:postId/like", toggleLike);

router.post("/:postId/comments", addComment);

router.delete("/:postId", deletePost);

export default router;
