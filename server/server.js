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
const server = http.createServer(app);

// Attach Socket.IO server
const io = new SocketIOServer(server, {
  cors: {
    origin: "http://localhost:5173", // Vite frontend origin
    methods: ["GET", "POST"],
  },
});

// Make Socket.IO accessible in routes
app.set("io", io);

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

  // Register socket with user's email
  socket.on("register-user", (email) => {
    socket.join(email); // Use email as private room
    console.log(`📧 Socket ${socket.id} registered as ${email}`);
  });

  // Join duel room
  socket.on("join-duel", ({ duelId, peerId }) => {
    socket.join(duelId);
    socket.to(duelId).emit("peer-connected", peerId);
    console.log(`📥 Socket ${socket.id} joined duel ${duelId}`);
  });


  // Handle real-time code sync
  socket.on("code-change", ({ duelId, code }) => {
    socket.to(duelId).emit("code-update", code);
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log(`👋 Client disconnected: ${socket.id}`);
  });
});



// Fallback for unhandled routes
app.use((req, res) => {
  res.status(404).send("Not Found");
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
