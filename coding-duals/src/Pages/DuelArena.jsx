import { useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import Editor from "@monaco-editor/react";
import socket from "../Utils/socket"; // Import the socket instance
import axios from "axios"; // Import axios for API calls
import { submitCode } from "../Utils/api"; // Import the submitCode function
import Peer from "peerjs"; // Updated import for Peer to use the correct library
import useTimer from "../Hooks/useTimer"; // Import the custom hook for timer

export default function DuelArena() {
  const { id } = useParams();
  const [problem, setProblem] = useState({
    title: "Two Sum",
    description:
      "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    input: "nums = [2,7,11,15], target = 9",
    output: "[0,1]",
  });
  const [language, setLanguage] = useState("cpp"); // default: C++

  const [userCode, setUserCode] = useState("// Your code here");
  const [opponentCode, setOpponentCode] = useState(
    "// Opponent's code will appear here"
  );
  const [winnerMessage, setWinnerMessage] = useState("");

  const [submissionStatus, setSubmissionStatus] = useState(""); // Feedback for submission
  const [myStream, setMyStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const myVideoRef = useRef();
  const remoteVideoRef = useRef();

  const timerRef = useRef(null);
  const peerRef = useRef(null);

  const { timeLeft, startTimer, stopTimer } = useTimer(15 * 60); // 15 minutes

  useEffect(() => {
    startTimer();
    return () => stopTimer();
  }, []);

  useEffect(() => {
    // Emit "join-duel" when the component is mounted
    socket.emit("join-duel", id);

    // Listen for the opponent's code updates
    socket.on("code-update", (incomingCode) => {
      setOpponentCode(incomingCode);
    });

    // Clean up the event listener on component unmount
    return () => {
      socket.off("code-update");
    };
  }, [id]);

  useEffect(() => {
    const peer = new Peer();
    peerRef.current = peer;

    peer.on("open", (peerId) => {
      console.log("My Peer ID:", peerId);
      socket.emit("join-duel", { duelId: id, peerId });
    });

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream) => {
        setMyStream(stream);
        if (myVideoRef.current) myVideoRef.current.srcObject = stream;

        peer.on("call", (call) => {
          call.answer(stream);
          call.on("stream", (remote) => {
            setRemoteStream(remote);
            if (remoteVideoRef.current)
              remoteVideoRef.current.srcObject = remote;
          });
        });

        socket.on("peer-connected", (otherPeerId) => {
          const call = peer.call(otherPeerId, stream);
          call.on("stream", (remote) => {
            setRemoteStream(remote);
            if (remoteVideoRef.current)
              remoteVideoRef.current.srcObject = remote;
          });
        });
      });

    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
      }
      if (myStream) {
        myStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [id, myStream]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleCodeChange = (value) => {
    setUserCode(value);
    // Emit the code change to the opponent
    socket.emit("code-change", { duelId: id, code: value });
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
          <video
            ref={myVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-32 bg-black rounded mb-2 object-cover"
          />
          <div className="mb-3">
            <label className="text-sm text-gray-400 mr-2">Language:</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-gray-700 text-white px-2 py-1 rounded"
            >
              <option value="cpp">C++</option>
              <option value="java">Java</option>
              <option value="python">Python</option>
            </select>
          </div>

          <Editor
            height="350px"
            defaultLanguage="cpp"
            theme="vs-dark"
            value={userCode}
            onChange={handleCodeChange}
            options={{ fontSize: 14 }}
          />
          {winnerMessage && (
            <div className="mt-4 bg-green-700 p-3 text-white rounded">
              {winnerMessage}
            </div>
          )}

          <button
            className="mt-3 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            onClick={async () => {
              try {
                const res = await submitCode(id, userCode, language);
                setWinnerMessage(res.message);
              } catch (err) {
                alert("❌ Submission failed: " + err.message);
              }
            }}
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
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-32 bg-black rounded mb-2 object-cover"
          />
          <Editor
            height="350px"
            defaultLanguage="cpp"
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
