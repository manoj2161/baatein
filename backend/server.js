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
import unsentRoutes from "./routes/unsentRoutes.js";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const app = express();
const httpServer = createServer(app);

// CORS CONFIGURATION
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  process.env.CLIENT_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
]
  .filter(Boolean)
  .map((origin) => origin.trim().replace(/\/$/, ""));

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = origin.replace(/\/$/, "");

    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    console.error("Blocked by CORS:", origin);
    return callback(new Error("Not allowed by CORS"));
  },

  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

// MIDDLEWARE
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// SOCKET.IO
const io = initializeSocket(httpServer);
app.set("io", io);

// API ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/users", followRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/stories", storyRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/explore", exploreRoutes);
app.use("/api/reels", reelRoutes);

// THE UNSENT
app.use("/api/unsent", unsentRoutes);

// HEALTH CHECK
app.get("/", (req, res) => {
  res.send("Baatein API is running");
});

// ERROR HANDLER
app.use((error, req, res, next) => {
  console.error(error);

  if (error.message === "Not allowed by CORS") {
    return res.status(403).json({
      message: "CORS error: This frontend origin is not allowed.",
    });
  }

  res.status(error.status || 500).json({
    message: error.message || "Internal server error",
  });
});

// START SERVER
const startServer = async () => {
  try {
    await connectDatabase();

    const PORT = process.env.PORT || 5000;

    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log("Socket.IO is ready");
      console.log("The Unsent routes are ready");
      console.log("Allowed frontend origins:", allowedOrigins);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
  }
};

startServer();
