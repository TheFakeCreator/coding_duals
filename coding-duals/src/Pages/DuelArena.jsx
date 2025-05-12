import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import Editor from "@monaco-editor/react";
import socket from "../Utils/socket";
import axios from "axios";
import { submitCode } from "../Utils/api";
import Peer from "peerjs";
import useTimer from "../Hooks/useTimer";

export default function DuelArena() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [problem, setProblem] = useState({
    title: "Two Sum",
    description:
      "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    input: "nums = [2,7,11,15], target = 9",
    output: "[0,1]",
  });
  const [language, setLanguage] = useState("cpp");
  const [userCode, setUserCode] = useState("// Your code here");
  const [opponentCode, setOpponentCode] = useState(
    "// Opponent's code will appear here"
  );
  const [winnerMessage, setWinnerMessage] = useState("");
  const [submissionStatus, setSubmissionStatus] = useState("");
  const [myStream, setMyStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const myVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerRef = useRef(null);
  const { timeLeft, startTimer, stopTimer } = useTimer(15 * 60);

  useEffect(() => {
    startTimer();
    return () => stopTimer();
  }, []);

  useEffect(() => {
    socket.emit("join-duel", id);
    socket.on("code-update", ({ email, code }) => {
      setOpponentCode(code); //OPPONENT CODE
    });
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
      if (peerRef.current) peerRef.current.destroy();
      if (myStream) myStream.getTracks().forEach((track) => track.stop());
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
    socket.emit("code-change", {
      email: localStorage.getItem("email"),
      duelId: id,
      code: value,
    });
    console.log(localStorage.getItem("email")); //challenger code
  };

  const handleTerminateDuel = () => {
    socket.emit("terminate-duel", { duelId: id });
    alert("The duel has been terminated.");
    navigate("/dashboard");
  };

  useEffect(() => {
    socket.on("duel-terminated", ({ message }) => {
      alert(message); // Optional: show termination reason
      navigate("/dashboard"); // Automatically go back to dashboard
    });

    return () => {
      socket.off("duel-terminated");
    };
  }, []);

  // Warn user before leaving the page or going back
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue =
        "Are you sure you want to leave the duel? It will be terminated.";
    };

    const handlePopState = () => {
      const confirmLeave = window.confirm(
        "Are you sure you want to leave the duel? It will be terminated."
      );
      if (confirmLeave) {
        handleTerminateDuel();
      } else {
        window.history.pushState(null, null, window.location.pathname);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.history.pushState(null, null, window.location.pathname);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Duel Arena</h2>
        <p className="text-sm text-gray-400">Duel ID: {id}</p>
      </div>

      <div className="mb-4 flex justify-between items-center">
        <div className="text-lg font-medium">
          ⏱️ Time Left: {formatTime(timeLeft)}
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-300">{problem.title}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
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

      <div className="bg-gray-800 p-4 rounded mt-6">
        <h4 className="text-lg font-bold mb-2">Problem Description</h4>
        <p className="text-sm text-gray-300 mb-2">{problem.description}</p>
        <pre className="text-sm text-gray-400">
          <strong>Input:</strong> {problem.input}
          {"\n"}
          <strong>Output:</strong> {problem.output}
        </pre>
      </div>

      <div className="mt-6 text-center">
        <button
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg"
          onClick={handleTerminateDuel}
        >
          Terminate Duel
        </button>
      </div>
    </div>
  );
}
