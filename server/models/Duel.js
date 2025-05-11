// server/models/Duel.js
import mongoose from "mongoose";

const DuelSchema = new mongoose.Schema({
  challenger: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  opponentEmail: { type: String, required: true },
  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    required: true,
  },
  questions: [String], // store problem IDs or titles
  status: {
    type: String,
    enum: ["pending", "active", "completed"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Duel", DuelSchema);
