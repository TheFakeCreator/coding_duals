// Updated to use Vite's environment variables
const API_BASE = "http://localhost:5000/api";
import Duel from "../../../server/models/Duel.js"; // adjust the path as needed

// Added error handling for network failures
export const fetchWithErrorHandling = async (url, options = {}) => {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Network error");
    }
    return await res.json();
  } catch (err) {
    console.error("API Error:", err.message);
    throw err;
  }
};

export const loginUser = async (email, password) => {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Login failed");
  return data;
};

export const deleteDuelById = async (duelId) => {
  try {
    const deletedDuel = await Duel.findByIdAndDelete(duelId);
    return deletedDuel;
  } catch (error) {
    console.error("Error deleting duel:", error.message);
    throw error;
  }
};

export const checkEmailExists = async (email) => {
  const res = await fetch(`${API_BASE}/auth/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Email verification failed");
  return data.exists; // true or false
};

export const registerUser = async (email, password) => {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Registration failed");
  return data;
};

export const createDuel = async (opponentEmail, difficulty) => {
  const token = localStorage.getItem("token");

  const res = await fetch("http://localhost:5000/api/duel/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    body: JSON.stringify({ opponentEmail, difficulty }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create duel");
  return data; // Contains duelId
};

export const submitCode = async (duelId, code, language) => {
  const token = localStorage.getItem("token");

  const res = await fetch("http://localhost:5000/api/duel/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    body: JSON.stringify({ duelId, code, language }), // Pass language here
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Submission failed");
  return data;
};
