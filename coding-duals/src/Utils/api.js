const API_BASE = "http://localhost:5000/api";

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
