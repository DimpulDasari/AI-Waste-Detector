import { useEffect, useState } from "react";

function Dashboard() {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://127.0.0.1:5000/statistics")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch statistics");
        }

        return response.json();
      })
      .then((data) => {
        if (data.success) {
          setStatistics(data);
        } else {
          setError("Could not load dashboard statistics.");
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Backend is not connected.");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="dashboard-page">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <p className="dashboard-error">{error}</p>
      </div>
    );
  }

  const categories = statistics.categories;

  return (
    <div className="dashboard-page">

      <h2>Waste Detection Dashboard</h2>

      {/* Total Detections */}

      <div className="total-card">

        <div className="total-icon">
          ♻️
        </div>

        <div>
          <p>Total Detections</p>
          <h3>{statistics.total_detections}</h3>
        </div>

      </div>


      {/* Category Statistics */}

      <div className="statistics-grid">

        <div className="stat-card">
          <span>🧴</span>
          <h3>{categories.Plastic}</h3>
          <p>Plastic</p>
        </div>

        <div className="stat-card">
          <span>📄</span>
          <h3>{categories.Paper}</h3>
          <p>Paper</p>
        </div>

        <div className="stat-card">
          <span>🍾</span>
          <h3>{categories.Glass}</h3>
          <p>Glass</p>
        </div>

        <div className="stat-card">
          <span>🔩</span>
          <h3>{categories.Metal}</h3>
          <p>Metal</p>
        </div>

        <div className="stat-card">
          <span>🌱</span>
          <h3>{categories.Organic}</h3>
          <p>Organic</p>
        </div>

        <div className="stat-card">
          <span>💻</span>
          <h3>{categories["E-Waste"]}</h3>
          <p>E-Waste</p>
        </div>

        <div className="stat-card">
          <span>🗑️</span>
          <h3>{categories.Other}</h3>
          <p>Other</p>
        </div>

      </div>

    </div>
  );
}

export default Dashboard;