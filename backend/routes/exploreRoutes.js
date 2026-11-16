import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";

import {
  getExplorePosts,
  searchExplore,
} from "../controllers/exploreController.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getExplorePosts);
router.get("/search", searchExplore);

export default router;
