// server/routes/duel.js
import express from "express";
import jwt from "jsonwebtoken";
import Duel from "../models/Duel.js";
import User from "../models/User.js";

const router = express.Router();

// Middleware to verify JWT
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // contains `id`
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

// POST /api/duel/create
router.post("/create", authMiddleware, async (req, res) => {
  const { opponentEmail, difficulty } = req.body;

  try {
    const challenger = await User.findById(req.user.id);
    if (!challenger) return res.status(404).json({ message: "User not found" });

    // Dummy question list for now
    const questions = [`question_${difficulty}_1`, `question_${difficulty}_2`];

    const duel = await Duel.create({
      challenger: challenger._id,
      opponentEmail,
      difficulty,
      questions,
    });

    res.json({ duelId: duel._id });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
