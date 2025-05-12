import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import duelRoutes from "./routes/duel.js";

dotenv.config();
connectDB();

const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Your frontend dev port
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/duel", duelRoutes);

// Socket.IO logic
io.on("connection", (socket) => {
  console.log("🟢 New client connected:", socket.id);

  socket.on("join-duel", (duelId) => {
    socket.join(duelId);
    console.log(`Socket ${socket.id} joined duel ${duelId}`);
  });

  socket.on("code-change", ({ duelId, code }) => {
    socket.to(duelId).emit("code-update", code);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
  });
});

// Start the server
server.listen(process.env.PORT || 5000, () =>
  console.log(`Server running on port ${process.env.PORT || 5000}`)
);
