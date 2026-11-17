import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

import { io, Socket } from "socket.io-client";

import {
  AuthUser,
  signupUser,
  loginUser,
  logoutUser,
  getCurrentUser,
} from "../services/authService";

import api, { clearAuthToken, getAuthToken } from "../services/api";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  socket: Socket | null;
  onlineUsers: Set<string>;

  unreadCounts: Record<string, number>;
  totalUnreadCount: number;
  notificationUnreadCount: number;

  login: (email: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SOCKET_URL = "https://baatein-1nk3.onrender.com";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);

  // RESTORE LOGIN SESSION
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        await clearAuthToken();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  // LOAD UNREAD MESSAGE COUNTS
  useEffect(() => {
    if (!user?._id) {
      setUnreadCounts({});
      return;
    }

    let cancelled = false;

    const loadUnreadCounts = async () => {
      try {
        const response = await api.get("/messages/conversations");
        const conversations = response.data.conversations || [];

        const counts: Record<string, number> = {};

        conversations.forEach((conversation: any) => {
          counts[conversation._id] = conversation.unreadCount || 0;
        });

        if (!cancelled) {
          setUnreadCounts(counts);
        }
      } catch (error) {
        console.error("Failed to load unread counts:", error);
      }
    };

    loadUnreadCounts();

    return () => {
      cancelled = true;
    };
  }, [user?._id]);

  // LOAD UNREAD NOTIFICATION COUNT
  useEffect(() => {
    if (!user?._id) {
      setNotificationUnreadCount(0);
      return;
    }

    let cancelled = false;

    const loadNotificationCount = async () => {
      try {
        const response = await api.get("/notifications");

        if (!cancelled) {
          setNotificationUnreadCount(response.data.unreadCount || 0);
        }
      } catch (error) {
        console.error("Failed to load notification count:", error);
      }
    };

    loadNotificationCount();

    return () => {
      cancelled = true;
    };
  }, [user?._id]);

  // GLOBAL SOCKET CONNECTION
  useEffect(() => {
    if (!user?._id) {
      setSocket(null);
      setOnlineUsers(new Set());
      return;
    }

    let cancelled = false;
    let newSocket: Socket | null = null;

    const connectSocket = async () => {
      try {
        const token = await getAuthToken();

        if (cancelled) return;

        if (!token) {
          console.error("Socket connection skipped: No auth token.");
          return;
        }

        newSocket = io(SOCKET_URL, {
          auth: {
            token,
          },
          transports: ["polling"],
          reconnection: true,
          reconnectionAttempts: Infinity,
          reconnectionDelay: 1000,
          timeout: 20000,
        });

        setSocket(newSocket);

        newSocket.on("connect", () => {
          console.log("Baatein Socket connected:", newSocket?.id);
        });

        newSocket.on("connect_error", (error) => {
          console.error("Socket connection error:", error.message);
        });

        newSocket.on("disconnect", (reason) => {
          console.log("Baatein Socket disconnected:", reason);
        });

        // ONLINE USERS
        newSocket.on("onlineUsers", (userIds: string[]) => {
          setOnlineUsers(new Set(userIds.map(String)));
        });

        // USER ONLINE / OFFLINE
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

        // NEW MESSAGE
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

        // SERVER-SIDE UNREAD COUNT UPDATE
        newSocket.on("unreadCountUpdated", (data) => {
          if (!data.conversationId) return;

          setUnreadCounts((previous) => ({
            ...previous,
            [data.conversationId]: data.unreadCount || 0,
          }));
        });

        // NEW NOTIFICATION
        newSocket.on("newNotification", (notification) => {
          if (notification.isRead) return;

          setNotificationUnreadCount((previous) => previous + 1);
        });

        // NOTIFICATION COUNT UPDATE
        newSocket.on("notificationCountUpdated", (data) => {
          setNotificationUnreadCount(data.unreadCount || 0);
        });
      } catch (error) {
        console.error("Socket initialization failed:", error);
      }
    };

    connectSocket();

    return () => {
      cancelled = true;

      if (newSocket) {
        newSocket.disconnect();
      }

      setSocket(null);
      setOnlineUsers(new Set());
    };
  }, [user?._id]);

  // TOTAL UNREAD MESSAGE COUNT
  const totalUnreadCount = Object.values(unreadCounts).reduce(
    (total, count) => total + count,
    0,
  );

  // SIGNUP
  const signup = async (username: string, email: string, password: string) => {
    const response = await signupUser({
      username,
      email,
      password,
    });

    setUser(response.user);
  };

  // LOGIN
  const login = async (email: string, password: string) => {
    const response = await loginUser({
      email,
      password,
    });

    setUser(response.user);
  };

  // LOGOUT
  const logout = async () => {
    try {
      await logoutUser();
    } finally {
      setUser(null);
      setSocket(null);
      setOnlineUsers(new Set());
      setUnreadCounts({});
      setNotificationUnreadCount(0);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,

        socket,
        onlineUsers,

        unreadCounts,
        totalUnreadCount,
        notificationUnreadCount,

        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ACCESS AUTHENTICATION FROM ANY COMPONENT
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
