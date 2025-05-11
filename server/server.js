import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import morgan from "morgan";

import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import duelRoutes from "./routes/duel.js";

dotenv.config();
connectDB();

const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: "http://localhost:5173", // Your frontend address (Vite default port)
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/duel", duelRoutes);

// Socket.IO logic
io.on("connection", (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);

  // Join a specific duel room
  socket.on("join-duel", ({ duelId, peerId }) => {
    socket.join(duelId);
    socket.to(duelId).emit("peer-connected", peerId);
    console.log(`📥 Socket ${socket.id} joined duel ${duelId}`);
  });

  // Relay code changes to the opponent
  socket.on("code-change", ({ duelId, code }) => {
    socket.to(duelId).emit("code-update", code);
  });

  socket.on("disconnect", () => {
    console.log(`👋 Client disconnected: ${socket.id}`);
  });
});

// Add error handling for unhandled routes
app.use((req, res) => {
  res.status(404).send("Not Found");
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
