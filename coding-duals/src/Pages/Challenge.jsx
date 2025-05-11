// src/pages/Challenge.jsx
import { useState } from "react";
import { createDuel,checkEmailExists } from "../Utils/api";
import { useNavigate } from "react-router-dom";

export default function Challenge() {
  const [email, setEmail] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const [error, setError] = useState("");
  const [valid, setValid] = useState(false);
  const navigate = useNavigate();
  const user=localStorage.getItem("email");
  const opp=email;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if(user!=opp && await checkEmailExists(opp)){
      try {
        const { duelId } = await createDuel(email, difficulty);
        console.log("Duel Created:", duelId);

        // Later: Navigate to duel room
        navigate(`/duel/${duelId}`);
      } catch (err) {
        setError(err.message);
      }

    }
    else{
      setValid(true);
    }
    
    
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 p-8 rounded-lg w-full max-w-md shadow-lg"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">
          Challenge a Friend
        </h1>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        {
          valid && <p className="text-red-400 text-m mb-4">Enter a Valid Email</p>
        }

        <label className="block mb-2 text-sm text-gray-300">
          Friend's Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="example@domain.com"
          className="w-full px-4 py-2 mb-4 rounded bg-gray-700 text-white"
        />

        <label className="block mb-2 text-sm text-gray-300">Difficulty</label>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="w-full px-4 py-2 mb-6 rounded bg-gray-700 text-white"
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>

        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 py-2 rounded"
        >
          Start Duel
        </button>
      </form>
    </div>
  );
}
