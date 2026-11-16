import express from "express";

import { signup, login, logout } from "../controllers/authController.js";

const router = express.Router();

// Register new user
router.post("/signup", signup);

// Login existing user
router.post("/login", login);

// Logout user
router.post("/logout", logout);

export default router;
