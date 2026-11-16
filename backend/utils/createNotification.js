import Notification from "../models/Notification.js";

const createNotification = async ({
  recipient,
  sender,
  type,
  post = null,
  message = "",
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

  return notification;
};

export default createNotification;
