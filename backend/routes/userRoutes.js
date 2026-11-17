import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import { imageUpload } from "../middleware/uploadMiddleware.js";

import {
  getProfile,
  updateProfile,
  updateProfilePicture,
  removeProfilePicture,
  checkUsernameAvailability,
  getUsers,
  getUserById,
  getFollowList,
  requestEmailChange,
  verifyEmailChange,
  updatePhoneNumber,
  deleteAccount,
} from "../controllers/userController.js";

import {
  blockUser,
  unblockUser,
  getBlockedUsers,
} from "../controllers/blockController.js";

const router = express.Router();

// ---------------------------------------------
// PUBLIC EMAIL VERIFICATION
// Must be before authMiddleware.
// ---------------------------------------------

router.get("/settings/verify-email/:token", verifyEmailChange);

// ---------------------------------------------
// AUTHENTICATION REQUIRED
// ---------------------------------------------

router.use(authMiddleware);

// SETTINGS

router.post("/settings/email", requestEmailChange);

router.put("/settings/phone", updatePhoneNumber);

router.delete("/settings/account", deleteAccount);

// ---------------------------------------------
// PROFILE
// ---------------------------------------------

router.get("/profile", getProfile);

router.get("/username-availability", checkUsernameAvailability);

router.put("/profile", updateProfile);

router.post(
  "/profile/picture",
  imageUpload.single("profilePicture"),
  updateProfilePicture,
);

router.delete("/profile/picture", removeProfilePicture);

// ---------------------------------------------
// BLOCK / UNBLOCK
// ---------------------------------------------

router.get("/blocked", getBlockedUsers);

router.post("/:userId/block", blockUser);

router.delete("/:userId/block", unblockUser);

// ---------------------------------------------
// USERS
// ---------------------------------------------

router.get("/", getUsers);

// ---------------------------------------------
// FOLLOWERS / FOLLOWING
// ---------------------------------------------

router.get("/:id/followers", getFollowList);

router.get("/:id/following", getFollowList);

// ---------------------------------------------
// OTHER USER PROFILE
// ---------------------------------------------

router.get("/:id", getUserById);

export default router;
