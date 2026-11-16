import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Conversation from "../models/Conversation.js";
import User from "../models/User.js";

const onlineUsers = new Map();

const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie || "";

      const tokenCookie = cookieHeader
        .split(";")
        .map((item) => item.trim())
        .find((item) => item.startsWith("token="));

      if (!tokenCookie) {
        console.log("Socket authentication failed: token cookie missing");
        return next(new Error("Authentication required"));
      }

      const token = decodeURIComponent(tokenCookie.substring("token=".length));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      socket.userId = decoded.id;

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

    // Broadcast the current online users.
    io.emit("onlineUsers", Array.from(onlineUsers.keys()));

    // Notify the other participant that this user is typing.
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

        io.to(recipient.toString()).emit("userTyping", {
          conversationId: conversationId.toString(),
          userId: userId.toString(),
        });
      } catch (error) {
        console.error("Typing event error:", error.message);
      }
    });

    // Notify the other participant that this user stopped typing.
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

        io.to(recipient.toString()).emit("userStoppedTyping", {
          conversationId: conversationId.toString(),
          userId: userId.toString(),
        });
      } catch (error) {
        console.error("Stop typing event error:", error.message);
      }
    });

    // Handle user disconnection.
    socket.on("disconnect", async () => {
      try {
        const connections = onlineUsers.get(userId) || 0;

        if (connections <= 1) {
          onlineUsers.delete(userId);

          const lastSeen = new Date();

          await User.findByIdAndUpdate(userId, {
            lastSeen,
          });

          // Notify everyone that this user is offline.
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
