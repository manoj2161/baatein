import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, MessageCircle, UserPlus, Bell, Check } from "lucide-react";

import Sidebar from "../components/Sidebar";
import {
  getNotifications,
  markNotificationRead,
  markAllRead,
} from "../services/notificationService";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotifications = async () => {
    try {
      setError("");
      const data = await getNotifications();
      setNotifications(data);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleRead = async (notificationId) => {
    try {
      await markNotificationRead(notificationId);

      setNotifications((previous) =>
        previous.map((notification) =>
          notification._id === notificationId
            ? { ...notification, isRead: true }
            : notification,
        ),
      );
    } catch (err) {
      console.error("Unable to mark notification as read:", err);
    }
  };

  const handleReadAll = async () => {
    try {
      await markAllRead();

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          isRead: true,
        })),
      );
    } catch (err) {
      console.error("Unable to mark all notifications as read:", err);
    }
  };

  const handleSenderClick = (notification) => {
    if (!notification.isRead) {
      handleRead(notification._id);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "like":
        return <Heart size={18} className="fill-current text-red-500" />;
      case "comment":
        return <MessageCircle size={18} className="text-blue-500" />;
      case "follow":
        return <UserPlus size={18} className="text-green-500" />;
      default:
        return <Bell size={18} className="text-gray-500" />;
    }
  };

  const getNotificationText = (notification) => {
    switch (notification.type) {
      case "like":
        return "liked your post";
      case "comment":
        return "commented on your post";
      case "follow":
        return "started following you";
      default:
        return "interacted with you";
    }
  };

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead,
  ).length;

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#171717]">
      <Sidebar />

      <main className="min-h-screen px-4 pb-24 pt-20 md:ml-[240px] md:px-8 md:pb-8 md:pt-8">
        <div className="mx-auto w-full max-w-[650px]">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-gray-900">
                Notifications
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                {unreadCount} unread notifications
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleReadAll}
                className="flex w-full shrink-0 items-center justify-center gap-2 self-start whitespace-nowrap rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-[#315efb] transition hover:bg-blue-100 sm:w-auto sm:self-center"
              >
                <Check size={18} />
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            {loading ? (
              <div className="p-10 text-center text-sm text-gray-500">
                Loading notifications...
              </div>
            ) : error ? (
              <div className="p-10 text-center text-sm text-red-500">
                {error}

                <button
                  onClick={loadNotifications}
                  className="ml-2 font-semibold text-[#315efb]"
                >
                  Retry
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
                  <Bell size={28} className="text-[#315efb]" />
                </div>

                <h2 className="text-lg font-semibold text-gray-900">
                  No notifications yet
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  When someone interacts with you, you'll see it here.
                </p>
              </div>
            ) : (
              notifications.map((notification) => {
                const sender = notification.sender;
                const senderId = sender?._id || sender?.id;

                const profileUrl = senderId ? `/profile/${senderId}` : null;

                const profilePicture =
                  sender?.profilePicture ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    sender?.username || "User",
                  )}`;

                return (
                  <div
                    key={notification._id}
                    className={`flex items-center gap-3 border-b border-gray-100 px-3 py-4 transition hover:bg-gray-50 sm:px-4 ${
                      !notification.isRead ? "bg-blue-50/50" : "bg-white"
                    }`}
                  >
                    {/* Sender Profile Picture */}
                    {profileUrl ? (
                      <Link
                        to={profileUrl}
                        onClick={() => handleSenderClick(notification)}
                        title={`View ${sender?.username || "user"}'s profile`}
                        className="shrink-0"
                      >
                        <img
                          src={profilePicture}
                          alt=""
                          className="h-10 w-10 rounded-full object-cover sm:h-11 sm:w-11"
                        />
                      </Link>
                    ) : (
                      <img
                        src={profilePicture}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-full object-cover sm:h-11 sm:w-11"
                      />
                    )}

                    {/* Notification Text */}
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm text-gray-800">
                        {profileUrl ? (
                          <Link
                            to={profileUrl}
                            onClick={() => handleSenderClick(notification)}
                            className="font-semibold hover:text-[#315efb] hover:underline"
                          >
                            {sender?.username || "Someone"}
                          </Link>
                        ) : (
                          <span className="font-semibold">
                            {sender?.username || "Someone"}
                          </span>
                        )}{" "}
                        {getNotificationText(notification)}
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        {notification.createdAt
                          ? new Date(notification.createdAt).toLocaleString()
                          : ""}
                      </p>
                    </div>

                    {/* Notification Type */}
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-50 sm:h-9 sm:w-9">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {!notification.isRead && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-[#315efb]" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Notifications;
