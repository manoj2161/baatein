import Notification from "../models/Notification.js";

// GET NOTIFICATIONS
export const getNotifications = async (req, res) => {
  try {
    const [notifications, unreadCount] = await Promise.all([
      Notification.find({
        recipient: req.user._id,
      })
        .populate("sender", "username profilePicture")
        .populate("post", "mediaUrl")
        .sort({ createdAt: -1 })
        .limit(50),

      Notification.countDocuments({
        recipient: req.user._id,
        isRead: false,
      }),
    ]);

    return res.status(200).json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Get notifications error:", error);

    return res.status(500).json({
      message: "Unable to load notifications",
    });
  }
};

// MARK NOTIFICATION AS READ
export const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.notificationId,
        recipient: req.user._id,
      },
      { isRead: true },
      { new: true },
    );

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    req.app
      .get("io")
      ?.to(req.user._id.toString())
      .emit("notificationCountUpdated", { unreadCount });

    return res.status(200).json({
      message: "Notification marked as read",
      notification,
      unreadCount,
    });
  } catch (error) {
    console.error("Mark notification read error:", error);

    return res.status(500).json({
      message: "Unable to update notification",
    });
  }
};

// MARK ALL AS READ
export const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        recipient: req.user._id,
        isRead: false,
      },
      { isRead: true },
    );

    req.app
      .get("io")
      ?.to(req.user._id.toString())
      .emit("notificationCountUpdated", { unreadCount: 0 });

    return res.status(200).json({
      message: "All notifications marked as read",
      unreadCount: 0,
    });
  } catch (error) {
    console.error("Mark all notifications read error:", error);

    return res.status(500).json({
      message: "Unable to update notifications",
    });
  }
};
