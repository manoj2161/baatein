import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";

import { followUser, unfollowUser } from "../controllers/followController.js";

const router = express.Router();

router.use(authMiddleware);

router.put("/:userId/follow", followUser);

router.put("/:userId/unfollow", unfollowUser);

export default router;
