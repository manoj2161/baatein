import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";

import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
} from "../controllers/followController.js";

const router = express.Router();

router.use(authMiddleware);

// FOLLOW / UNFOLLOW
router.put("/:userId/follow", followUser);

router.put("/:userId/unfollow", unfollowUser);

// GET FOLLOWERS / FOLLOWING
router.get("/:userId/followers", getFollowers);

router.get("/:userId/following", getFollowing);

export default router;
