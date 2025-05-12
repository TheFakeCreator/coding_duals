import express from "express";
import jwt from "jsonwebtoken";
import Duel from "../models/Duel.js";
import User from "../models/User.js";
import axios from "axios";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
// Added express-validator for request validation
import { body, validationResult } from "express-validator";

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
    const io = req.app.get("io"); 
    io.to(opponentEmail).emit("challenge-requested", {
      from: challenger.email,
      difficulty,
      duelId: duel._id,
    });

    res.json({ duelId: duel._id });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/duel/ongoing
router.get("/ongoing/all", authMiddleware, async (req, res) => {
  try {
    // Fetch all duels that are ongoing (status = pending) and sort by createdAt in descending order
    const duels = await Duel.find({
      status: "pending", // or use status: { $in: ["active", "pending"] } to include all ongoing types
    })
      .populate("challenger", "email")
      .sort({ createdAt: -1 }); // Sort by createdAt in descending order

    res.json(duels);
  } catch (err) {
    console.error("Error fetching all ongoing duels:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});


router.get("/:id/opponent-email", async (req, res) => {
  try {
    const duelId = req.params.id;
    const duel = await Duel.findById(duelId);
    console.log(duel);
    if (!duel) {
      return res.status(404).json({ message: "Duel not found" });
    }

    res.json({ opponentEmail: duel.opponentEmail });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST /api/duel/submit
router.post(
  "/submit",
  authMiddleware,
  [
    body("duelId").notEmpty().withMessage("Duel ID is required"),
    body("code").notEmpty().withMessage("Code is required"),
    body("language")
      .isIn(["cpp", "java", "python"])
      .withMessage("Invalid language"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { duelId, code, language } = req.body;
    const userId = req.user.id;
    if (!language) {
      return res.status(400).json({ message: "Language is required" });
    }
    const input = `2 7 11 15\n9\n`; // Simulated test input

    // Judge0 language IDs (simplified)
    const languageIds = {
      cpp: 54,
      java: 62,
      python: 71,
    };

    const langId = languageIds[language];
    if (!langId)
      return res.status(400).json({ message: "Unsupported language" });

    try {
      // 1. Submit code
      console.log("Request body:", {
        source_code: code,
        language_id: langId,
        stdin: input,
      });
      console.log("Request headers:", {
        "content-type": "application/json",
        "X-RapidAPI-Key": "c2285ca8fcmsh777d219158e258dp1e06a2jsn273d682ab6c4",
        "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
      });

      const { data: submission } = await axios.post(
        "https://judge0-ce.p.rapidapi.com/submissions",
        {
          source_code: code,
          language_id: langId,
          stdin: input,
        },
        {
          headers: {
            "content-type": "application/json",
            "X-RapidAPI-Key":
              "c2285ca8fcmsh777d219158e258dp1e06a2jsn273d682ab6c4",
            "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
          },
        }
      );

      const token = submission.token;

      // 2. Poll for result
      let result;
      for (let i = 0; i < 10; i++) {
        const { data: resData } = await axios.get(
          `https://judge0-ce.p.rapidapi.com/submissions/${token}`,
          {
            headers: {
              "X-RapidAPI-Key":
                "c2285ca8fcmsh777d219158e258dp1e06a2jsn273d682ab6c4",
              "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
            },
          }
        );

        if (resData.status.id >= 3) {
          result = resData;
          break;
        }
        await new Promise((r) => setTimeout(r, 1000));
      }

      if (!result)
        return res.status(408).json({ message: "Execution timeout" });
      console.log("stdout:", result.stdout);
      console.log("stderr:", result.stderr);
      console.log("compile_output:", result.compile_output);

      const output = (result.stdout || "").trim();
      const expected = "[0,1]";

      const normalize = (str) => str.replace(/\s/g, "");

      const isCorrect = normalize(output) === normalize(expected);
      console.log("Output:", output);
      console.log("Expected:", expected);
      console.log("Equal:", isCorrect);

      if (isCorrect) {
        const duel = await Duel.findById(duelId);

        if (!duel) return res.status(404).json({ message: "Duel not found" });
        if (duel.status === "completed") {
          return res.json({ message: "This duel has already ended." });
        }

        duel.status = "completed";
        duel.winner = userId;
        await duel.save();

        return res.json({
          status: "correct",
          message: "✅ Code accepted! You win the duel!",
          winner: userId,
        });
      } else {
        res.json({
          status: "incorrect",
          output,
          expected,
          message: "❌ Incorrect output.",
        });
      }
    } catch (err) {
      console.error("Error during code submission:", err.message);
      console.error("Stack trace:", err.stack);
      res.status(500).json({ message: "Execution failed" });
    }
  }
);

export default router;
