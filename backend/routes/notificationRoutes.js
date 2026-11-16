import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";

import {
  getNotifications,
  markNotificationRead,
  markAllRead,
} from "../controllers/notificationController.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getNotifications);

router.put("/read-all", markAllRead);

router.put("/:notificationId/read", markNotificationRead);

export default router;
