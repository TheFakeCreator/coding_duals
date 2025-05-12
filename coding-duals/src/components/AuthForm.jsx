// src/components/AuthForm.jsx
import { useState } from "react";
import { loginUser, registerUser } from "../Utils/api.js";
import { useNavigate } from "react-router-dom";
import socket from "../Utils/socket";

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const { token } = isLogin
        ? await loginUser(formData.email, formData.password)
        : await registerUser(formData.email, formData.password);

      localStorage.setItem("token", token);
      localStorage.setItem("email", formData.email);
      if (formData.email) {
        socket.emit("register-user", formData.email);
        console.log("DONE");
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="w-full max-w-sm p-6 mx-auto bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold text-white mb-6 text-center">
        {isLogin ? "Login" : "Register"}
      </h2>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="w-full px-4 py-2 rounded bg-gray-700 text-white"
          onChange={handleChange}
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          required
          className="w-full px-4 py-2 rounded bg-gray-700 text-white"
          onChange={handleChange}
        />
        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 py-2 rounded text-white"
        >
          {isLogin ? "Login" : "Register"}
        </button>
      </form>

      <p className="text-gray-300 mt-4 text-sm text-center">
        {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-indigo-400 hover:underline ml-1"
        >
          {isLogin ? "Register" : "Login"}
        </button>
      </p>
    </div>
  );
}
