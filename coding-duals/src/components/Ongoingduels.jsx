import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const OngoingDuels = () => {
  const [duels, setDuels] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDuels = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/duel/ongoing/all", {
          headers: {
            Authorization: token,
          },
        });
        setDuels(res.data);
      } catch (err) {
        console.error("Failed to fetch all duels:", err.message);
      }
    };

    fetchDuels();
  }, []);

  return (
    <section className="p-6 bg-blue rounded-xl shadow-md mt-6">
      <h2 className="text-xl font-semibold mb-4">All Ongoing Duels</h2>
      {duels.length === 0 ? (
        <p className="text-gray-600">No ongoing duels</p>
      ) : (
        <ul className="space-y-3">
          {duels.map((duel) => (
            <li
              key={duel._id}
              className="flex justify-between items-center p-3 bg-black rounded-lg"
            >
              <span>
                <strong>{duel.challenger.email}</strong> vs <strong>{duel.opponentEmail}</strong>{" "}
                - Difficulty: <span className="capitalize">{duel.difficulty}</span>
              </span>
              <button
                onClick={() => navigate(`/duel/${duel._id}`)}
                className="bg-indigo-600 text-white px-4 py-1 rounded-lg hover:bg-indigo-700 transition"
              >
                Watch
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default OngoingDuels;
