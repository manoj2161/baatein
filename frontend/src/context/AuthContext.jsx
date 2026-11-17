import { createContext, useContext, useEffect, useState } from "react";

import { io } from "socket.io-client";
import api from "../api/axios";

const AuthContext = createContext(null);

const SOCKET_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/api\/?$/, "");

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  const [unreadCounts, setUnreadCounts] = useState({});
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);

  const checkAuth = async () => {
    try {
      const response = await api.get("/users/profile");

      const userData =
        response.data.user || response.data.profile || response.data;

      setUser(userData);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Load unread message counts.
  useEffect(() => {
    if (!user?._id) {
      setUnreadCounts({});
      return;
    }

    const loadUnreadCounts = async () => {
      try {
        const response = await api.get("/messages/conversations");
        const conversations = response.data.conversations || [];

        const counts = {};

        conversations.forEach((conversation) => {
          counts[conversation._id] = conversation.unreadCount || 0;
        });

        setUnreadCounts(counts);
      } catch (error) {
        console.error("Failed to load unread counts:", error);
      }
    };

    loadUnreadCounts();
  }, [user?._id]);

  // Load unread notification count.
  useEffect(() => {
    if (!user?._id) {
      setNotificationUnreadCount(0);
      return;
    }

    const loadNotificationCount = async () => {
      try {
        const response = await api.get("/notifications");
        setNotificationUnreadCount(response.data.unreadCount || 0);
      } catch (error) {
        console.error("Failed to load notification count:", error);
      }
    };

    loadNotificationCount();
  }, [user?._id]);

  // Maintain one global Socket.IO connection.
  useEffect(() => {
    if (!user?._id) {
      setSocket(null);
      setOnlineUsers(new Set());
      return;
    }

    const newSocket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Global Socket connected:", newSocket.id);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
    });

    newSocket.on("onlineUsers", (userIds) => {
      setOnlineUsers(new Set(userIds.map(String)));
    });

    newSocket.on("userStatus", (data) => {
      const changedUserId = String(data.userId);

      setOnlineUsers((previous) => {
        const updated = new Set(previous);

        if (data.isOnline) {
          updated.add(changedUserId);
        } else {
          updated.delete(changedUserId);
        }

        return updated;
      });
    });

    newSocket.on("newMessage", (message) => {
      const senderId =
        typeof message.sender === "object"
          ? message.sender?._id
          : message.sender;

      if (String(senderId) === String(user._id)) return;

      const conversationId =
        typeof message.conversation === "object"
          ? message.conversation?._id
          : message.conversation;

      if (!conversationId) return;

      setUnreadCounts((previous) => ({
        ...previous,
        [conversationId]: (previous[conversationId] || 0) + 1,
      }));
    });

    newSocket.on("unreadCountUpdated", (data) => {
      if (!data.conversationId) return;

      setUnreadCounts((previous) => ({
        ...previous,
        [data.conversationId]: data.unreadCount || 0,
      }));
    });

    newSocket.on("newNotification", (notification) => {
      if (notification.isRead) return;

      setNotificationUnreadCount((previous) => previous + 1);
    });

    newSocket.on("notificationCountUpdated", (data) => {
      setNotificationUnreadCount(data.unreadCount || 0);
    });

    return () => {
      newSocket.disconnect();
      setSocket(null);
      setOnlineUsers(new Set());
    };
  }, [user?._id]);

  const totalUnreadCount = Object.values(unreadCounts).reduce(
    (total, count) => total + count,
    0,
  );

  const signup = async (formData) => {
    const response = await api.post("/auth/signup", formData);

    const userData = response.data.user || response.data;

    setUser(userData);
    return response.data;
  };

  const login = async (formData) => {
    const response = await api.post("/auth/login", formData);

    const userData = response.data.user || response.data;

    setUser(userData);
    return response.data;
  };

  // Clear local authentication without calling the backend.
  const clearAuth = () => {
    setUser(null);
    setUnreadCounts({});
    setNotificationUnreadCount(0);
    setOnlineUsers(new Set());
  };

  // Normal logout.
  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      clearAuth();
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        socket,
        onlineUsers,
        unreadCounts,
        totalUnreadCount,
        notificationUnreadCount,
        signup,
        login,
        logout,
        clearAuth,
        updateUser,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};
