import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";

import {
  getProfile,
  updateProfile,
  getUsers,
  getUserById,
} from "../controllers/userController.js";

const router = express.Router();

// All routes require login
router.use(authMiddleware);

router.get("/profile", getProfile);

router.put("/profile", updateProfile);

router.get("/", getUsers);

router.get("/:id", getUserById);

export default router;
