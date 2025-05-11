import { useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios"; // Import axios for API calls

export default function DuelArena() {
  const { id } = useParams();
  const [problem, setProblem] = useState({
    title: "Two Sum",
    description:
      "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    input: "nums = [2,7,11,15], target = 9",
    output: "[0,1]",
  });

  const [userCode, setUserCode] = useState("// Your code here");
  const [opponentCode] = useState("// Opponent's code will appear here");

  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 mins in seconds
  const [submissionStatus, setSubmissionStatus] = useState(""); // Feedback for submission
  const timerRef = useRef(null);

  // Function to handle code submission
  const submitCode = async () => {
    try {
      console.log("Submitting code...");
      const response = await axios.post(
        "http://localhost:5000/api/duel/submit",
        {
          duelId: id,
          code: userCode,
        }
      );
      console.log("Code submitted successfully:", response.data);

      // Check if the code is correct
      if (response.data.correct) {
        setSubmissionStatus("✅ Correct! Proceed to the next question.");
        // Logic to load the next question can go here
      } else {
        setSubmissionStatus("❌ Incorrect. Try again.");
      }
    } catch (error) {
      console.error("Error submitting code:", error);
      setSubmissionStatus("❌ Submission failed. Please try again.");
    }
  };

  // Timer logic
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          console.log("⏰ Time’s up! Duel over.");
          submitCode(); // Auto-submit code when time runs out
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  useEffect(() => {
    console.log("Duel ID:", id);
    // Later: fetch problem from backend using id
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Duel Arena</h2>
        <p className="text-sm text-gray-400">Duel ID: {id}</p>
      </div>

      {/* Timer and Problem Title */}
      <div className="mb-4 flex justify-between items-center">
        <div className="text-lg font-medium">
          ⏱️ Time Left: {formatTime(timeLeft)}
        </div>

        <div className="text-right">
          <p className="text-sm text-gray-300">{problem.title}</p>
        </div>
      </div>

      {/* Code Editors */}
      <div className="grid grid-cols-2 gap-4">
        {/* You */}
        <div className="bg-gray-800 p-4 rounded">
          <h3 className="mb-2 text-lg font-semibold">You</h3>
          <div className="bg-black h-32 mb-2 rounded flex items-center justify-center text-gray-500">
            Webcam Feed
          </div>
          <Editor
            height="350px"
            defaultLanguage="javascript"
            theme="vs-dark"
            value={userCode}
            onChange={(value) => setUserCode(value)}
            options={{ fontSize: 14 }}
          />
          <button
            onClick={submitCode}
            className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Submit Code
          </button>
          {submissionStatus && (
            <p className="mt-2 text-sm text-gray-300">{submissionStatus}</p>
          )}
        </div>

        {/* Opponent */}
        <div className="bg-gray-800 p-4 rounded">
          <h3 className="mb-2 text-lg font-semibold">Opponent</h3>
          <div className="bg-black h-32 mb-2 rounded flex items-center justify-center text-gray-500">
            Webcam Feed
          </div>
          <Editor
            height="350px"
            defaultLanguage="javascript"
            theme="vs-dark"
            value={opponentCode}
            options={{ readOnly: true, fontSize: 14 }}
          />
        </div>
      </div>

      {/* Problem Description */}
      <div className="bg-gray-800 p-4 rounded mt-6">
        <h4 className="text-lg font-bold mb-2">Problem Description</h4>
        <p className="text-sm text-gray-300 mb-2">{problem.description}</p>
        <pre className="text-sm text-gray-400">
          <strong>Input:</strong> {problem.input}
          {"\n"}
          <strong>Output:</strong> {problem.output}
        </pre>
      </div>
    </div>
  );
}
