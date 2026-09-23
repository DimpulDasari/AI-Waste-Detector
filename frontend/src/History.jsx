import { useEffect, useState } from "react";

function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://127.0.0.1:5000/history")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch history");
        }

        return response.json();
      })
      .then((data) => {
        if (data.success) {
          setHistory(data.data);
        } else {
          setError("Could not load detection history.");
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Backend is not connected.");
        setLoading(false);
      });
  }, []);

  return (
    <div className="history-page">
      <h2>Detection History</h2>

      {loading && <p>Loading history...</p>}

      {error && <p className="history-error">{error}</p>}

      {!loading && !error && history.length === 0 && (
        <p>No detection records found.</p>
      )}

      {!loading && !error && history.length > 0 && (
        <div className="history-table-container">
          <table className="history-table">
            <thead>
              <tr>
                <th>Waste</th>
                <th>Category</th>
                <th>Confidence</th>
                <th>Suggestion</th>
                <th>Date & Time</th>
              </tr>
            </thead>

            <tbody>
              {history.map((item) => (
                <tr key={item.id}>
                  <td>{item.waste}</td>
                  <td>{item.category}</td>
                  <td>{item.confidence}%</td>
                  <td>{item.suggestion}</td>
                  <td>
                    {new Date(item.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default History;