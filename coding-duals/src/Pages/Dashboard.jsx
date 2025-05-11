// src/pages/Dashboard.jsx
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleChallengeFriend = () => {
    navigate("/challenge");
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-red-600 px-4 py-2 rounded hover:bg-red-700"
        >
          Logout
        </button>
      </div>

      <div className="mb-6">
        <button
          onClick={handleChallengeFriend}
          className="bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded text-white"
        >
          Challenge a Friend
        </button>
      </div>

      <section className="mt-8">
        <h2 className="text-xl mb-4">Recent Duels</h2>
        <div className="bg-gray-800 p-4 rounded shadow">
          {/* Later we will fetch duels from backend */}
          <p className="text-gray-400">You haven't played any duels yet.</p>
        </div>
      </section>
    </div>
  );
}
