import Notification from "../models/Notification.js";

const createNotification = async ({
  recipient,
  sender,
  type,
  post = null,
  message = "",
  io = null,
}) => {
  if (recipient.toString() === sender.toString()) {
    return null;
  }

  const notification = await Notification.create({
    recipient,
    sender,
    type,
    post,
    message,
  });

  // Populate sender details for the frontend.
  await notification.populate("sender", "username profilePicture");

  // Send notification to the recipient's Socket.IO room.
  if (io) {
    io.to(recipient.toString()).emit("newNotification", notification);
  }

  return notification;
};

export default createNotification;
