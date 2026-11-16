import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import dns from "node:dns";
import connectDatabase from "./config/database.js";
import initializeSocket from "./config/socket.js";
import exploreRoutes from "./routes/exploreRoutes.js";
import reelRoutes from "./routes/reelRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import followRoutes from "./routes/followRoutes.js";
import storyRoutes from "./routes/storyRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

dns.setServers(["8.8.8.8", "8.8.4.4"]);
const app = express();
const httpServer = createServer(app);

// Middleware
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);

// Socket.IO
const io = initializeSocket(httpServer);
app.set("io", io);

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/users", followRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/stories", storyRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/explore", exploreRoutes);
app.use("/api/reels", reelRoutes);
app.get("/", (req, res) => {
  res.send("Baatein API is running");
});

// Error handler
app.use((error, req, res, next) => {
  console.error(error);

  res.status(error.status || 500).json({
    message: error.message || "Internal server error",
  });
});

// Start server
const startServer = async () => {
  try {
    await connectDatabase();

    const PORT = process.env.PORT || 5000;

    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log("Socket.IO is ready");
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
  }
};

startServer();
