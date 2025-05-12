// server/models/Duel.js
import mongoose from "mongoose";

const DuelSchema = new mongoose.Schema(
  {
    challenger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    opponentEmail: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid email!`,
      },
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
    },
    questions: [String],
    status: {
      type: String,
      enum: ["pending", "active", "completed"],
      default: "pending",
    },
    winner: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // new
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Duel", DuelSchema);
