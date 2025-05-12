// src/App.jsx
import { Routes, Route } from "react-router-dom";
import Home from "./Pages/Home";
import Login from "./Pages/Login";
import Dashboard from "./Pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import Challenge from "./Pages/Challenge";
import DuelArena from "./Pages/DuelArena";
import WatchArena from "./Pages/WatchArena"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/challenge"
        element={
          <ProtectedRoute>
            <Challenge />
          </ProtectedRoute>
        }
      />
      <Route
        path="/duel/:id"
        element={
          <ProtectedRoute>
            <DuelArena />
          </ProtectedRoute>
        }
      />
      <Route
        path="/watch/:id"
        element={
          <ProtectedRoute>
            <WatchArena />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
