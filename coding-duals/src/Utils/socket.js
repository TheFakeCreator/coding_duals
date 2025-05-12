// utils/socket.js
import { io } from "socket.io-client";

// Use environment variables for the socket connection URL
const socket = io(import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"); // Default to localhost if not set

export default socket;
