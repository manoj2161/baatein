import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

import { createReel, getReels } from "../controllers/reelController.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getReels);
router.post("/", upload.single("media"), createReel);

export default router;
