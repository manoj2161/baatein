import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";

import {
  createUnsent,
  getUnsentFeed,
  getMyUnsent,
  toggleUnsentReaction,
  deleteUnsent,
} from "../controllers/unsentController.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", createUnsent);

router.get("/feed", getUnsentFeed);

router.get("/my", getMyUnsent);

router.put("/:unsentId/reaction", toggleUnsentReaction);

router.delete("/:unsentId", deleteUnsent);

export default router;
