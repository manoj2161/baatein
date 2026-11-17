import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Conversation from "../models/Conversation.js";
import User from "../models/User.js";

const onlineUsers = new Map();

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  process.env.CLIENT_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
]
  .filter(Boolean)
  .map((origin) => origin.trim().replace(/\/$/, ""));

const getSocketToken = (socket) => {
  // Expo/native clients can send the token through Socket.IO auth.
  const authToken = socket.handshake.auth?.token;

  if (authToken) {
    return authToken;
  }

  // Also support an Authorization header if a client uses one.
  const authorization = socket.handshake.headers.authorization || "";

  if (authorization.startsWith("Bearer ")) {
    return authorization.slice(7).trim();
  }

  // Existing browser clients continue using the token cookie.
  const cookieHeader = socket.handshake.headers.cookie || "";
  const tokenCookie = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith("token="));

  if (!tokenCookie) {
    return null;
  }

  return decodeURIComponent(tokenCookie.substring("token=".length));
};

// CHECK WHETHER EITHER USER HAS BLOCKED THE OTHER
const isBlockedBetweenUsers = async (userId1, userId2) => {
  const [user1, user2] = await Promise.all([
    User.findById(userId1).select("blockedUsers"),
    User.findById(userId2).select("blockedUsers"),
  ]);

  if (!user1 || !user2) return true;

  const user1BlocksUser2 = user1.blockedUsers?.some(
    (id) => id.toString() === user2._id.toString(),
  );

  const user2BlocksUser1 = user2.blockedUsers?.some(
    (id) => id.toString() === user1._id.toString(),
  );

  return user1BlocksUser2 || user2BlocksUser1;
};

const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) {
          return callback(null, true);
        }

        const normalizedOrigin = origin.replace(/\/$/, "");

        if (allowedOrigins.includes(normalizedOrigin)) {
          return callback(null, true);
        }

        console.error("Socket.IO CORS blocked:", origin);
        return callback(new Error("Not allowed by Socket.IO CORS"));
      },
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  // SOCKET AUTHENTICATION
  io.use(async (socket, next) => {
    try {
      const token = getSocketToken(socket);

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("_id isDeleted");

      if (!user || user.isDeleted) {
        return next(new Error("Invalid authentication"));
      }

      socket.userId = user._id.toString();
      next();
    } catch (error) {
      console.error("Socket authentication error:", error.message);
      next(new Error("Invalid authentication"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;

    socket.join(userId);

    onlineUsers.set(userId, (onlineUsers.get(userId) || 0) + 1);

    console.log("User connected to Socket.IO:", userId);

    io.emit("onlineUsers", Array.from(onlineUsers.keys()));

    // TYPING INDICATOR
    socket.on("typing", async ({ conversationId } = {}) => {
      try {
        if (!conversationId) return;

        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: userId,
        }).select("participants");

        if (!conversation) return;

        const recipient = conversation.participants.find(
          (participant) => participant.toString() !== userId.toString(),
        );

        if (!recipient) return;

        const blocked = await isBlockedBetweenUsers(userId, recipient);

        if (blocked) return;

        io.to(recipient.toString()).emit("userTyping", {
          conversationId: conversationId.toString(),
          userId: userId.toString(),
        });
      } catch (error) {
        console.error("Typing event error:", error.message);
      }
    });

    // STOP TYPING INDICATOR
    socket.on("stopTyping", async ({ conversationId } = {}) => {
      try {
        if (!conversationId) return;

        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: userId,
        }).select("participants");

        if (!conversation) return;

        const recipient = conversation.participants.find(
          (participant) => participant.toString() !== userId.toString(),
        );

        if (!recipient) return;

        const blocked = await isBlockedBetweenUsers(userId, recipient);

        if (blocked) return;

        io.to(recipient.toString()).emit("userStoppedTyping", {
          conversationId: conversationId.toString(),
          userId: userId.toString(),
        });
      } catch (error) {
        console.error("Stop typing event error:", error.message);
      }
    });

    // HANDLE USER DISCONNECTION
    socket.on("disconnect", async () => {
      try {
        const connections = onlineUsers.get(userId) || 0;

        if (connections <= 1) {
          onlineUsers.delete(userId);

          const lastSeen = new Date();

          await User.findByIdAndUpdate(userId, {
            lastSeen,
          });

          io.emit("userStatus", {
            userId: userId.toString(),
            isOnline: false,
            lastSeen,
          });
        } else {
          onlineUsers.set(userId, connections - 1);
        }

        io.emit("onlineUsers", Array.from(onlineUsers.keys()));

        console.log("User disconnected from Socket.IO:", userId);
      } catch (error) {
        console.error("Disconnect handling error:", error.message);
      }
    });
  });

  return io;
};

export default initializeSocket;
