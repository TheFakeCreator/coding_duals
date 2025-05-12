import { useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import Editor from "@monaco-editor/react";
import socket from "../Utils/socket";
import axios from "axios";
import Peer from "peerjs";

export default function WatchArena() {
  const { id } = useParams();
  const [userCode, setUserCode] = useState("// Challenger's code");
  const [opponentCode, setOpponentCode] = useState("// Opponent's code");
  const [duel, setDuel] = useState(null);
  let email2;

  const challengerVideoRef = useRef();
  const opponentVideoRef = useRef();
  const peerRef = useRef(null);

  useEffect(() => {
    const fetchOpponentEmail = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/duel/${id}/opponent-email`);
        email2=res.data.opponentEmail;
      } catch (err) {
        console.error("Error fetching opponent email:", err);
      }
    };

    fetchOpponentEmail();
  }, [id]);

  useEffect(() => {
    const peer = new Peer();
    peerRef.current = peer;

    peer.on("open", (peerId) => {
      socket.emit("join-duel", { duelId: id, peerId, isWatcher: true });
    });

    peer.on("call", (call) => {
      call.answer(); // watchers don't send their own video/audio
      call.on("stream", (remoteStream) => {
        if (!challengerVideoRef.current || !opponentVideoRef.current) return;

        // Assign based on availability (first call → challenger, second → opponent)
        if (!challengerVideoRef.current.srcObject) {
          challengerVideoRef.current.srcObject = remoteStream;
        } else if (!opponentVideoRef.current.srcObject) {
          opponentVideoRef.current.srcObject = remoteStream;
        }
      });
    });

    return () => {
      if (peerRef.current) peerRef.current.destroy();
    };
  }, [id]);

  useEffect(() => {
    socket.emit("join-duel", id);

    socket.on("code-update", ({ email, code }) => {
      if (email == email2) {
        setOpponentCode(code);
      }
      else {
        setUserCode(code);

      }
    });

    return () => {
      socket.off("code-update");
    };
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">👀 Watch Arena</h2>
        <p className="text-sm text-gray-400">Duel ID: {id}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-800 p-4 rounded">
          <h3 className="mb-2 text-lg font-semibold">Challenger</h3>
          <video
            ref={challengerVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-32 bg-black rounded mb-2 object-cover"
          />
          <Editor
            height="350px"
            defaultLanguage="cpp"
            theme="vs-dark"
            value={userCode}
            options={{ readOnly: true, fontSize: 14 }}
          />
        </div>

        <div className="bg-gray-800 p-4 rounded">
          <h3 className="mb-2 text-lg font-semibold">Opponent</h3>
          <video
            ref={opponentVideoRef}
            autoPlay
            playsInline
            muted
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
    </div>
  );
}
