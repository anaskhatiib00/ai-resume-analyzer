import { useEffect, useState } from "react";
import "./App.css";

function getErrorMessage(err) {
  if (typeof err === "string") return err;
  if (err?.message) return err.message;
  return JSON.stringify(err);
}

const API_URL = "http://127.0.0.1:8000";

function getGuestId() {
  let guestId = localStorage.getItem("guest_id");

  if (!guestId) {
    guestId = crypto.randomUUID();
    localStorage.setItem("guest_id", guestId);
  }

  return guestId;
}

function App() {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [savedAnalyses, setSavedAnalyses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState("");

  const guestId = getGuestId();

  const fetchAnalyses = async () => {
    try {
      setHistoryLoading(true);

      const response = await fetch(`${API_URL}/analyses`, {
        headers: {
          "guest-id": guestId,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : JSON.stringify(data.detail || data)
        );
      }

      setSavedAnalyses(data.analyses);
    } catch (err) {
      setError(typeof err === "string" ? err : err.message || JSON.stringify(err));
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setError("Please upload a PDF resume.");
      return;
    }

    if (!jobDescription.trim()) {
      setError("Please enter a job description.");
      return;
    }

    setLoading(true);
    setError("");
    setAnalysis(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("job_description", jobDescription);

    try {
      const response = await fetch(`${API_URL}/analyze-resume`, {
        method: "POST",
        headers: {
          "guest-id": guestId,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : JSON.stringify(data.detail || data)
        );
      }

      setAnalysis(data.analysis);
      fetchAnalyses();
    } catch (err) {
      setError(typeof err === "string" ? err : err.message || JSON.stringify(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (analysisId) => {
    try {
      const response = await fetch(`${API_URL}/analyses/${analysisId}`, {
        method: "DELETE",
        headers: {
          "guest-id": guestId,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : JSON.stringify(data.detail || data)
        );
      }

      setSavedAnalyses(savedAnalyses.filter((item) => item.id !== analysisId));
    } catch (err) {
      setError(typeof err === "string" ? err : err.message || JSON.stringify(err));
    }
  };

  const handleViewAnalysis = async (analysisId) => {
    try {
      const response = await fetch(`${API_URL}/analyses/${analysisId}`, {
        headers: {
          "guest-id": guestId,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : JSON.stringify(data.detail || data)
        );
      }

      setAnalysis(data);
    } catch (err) {
      setError(typeof err === "string" ? err : err.message || JSON.stringify(err));
    }
  };

  return (
    <div className="app">
      <div className="container">
        <h1>AI Resume Analyzer</h1>
        <p>Upload your resume and compare it with a job description.</p>

        <form onSubmit={handleSubmit} className="form">
          <label>Upload Resume (PDF)</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files[0])}
          />

          <label>Job Description</label>
          <textarea
            rows="8"
            placeholder="Paste the job description here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />

          <button type="submit" disabled={loading}>
            {loading ? "Analyzing..." : "Analyze Resume"}
          </button>
        </form>

        {error && <p className="error">{error}</p>}

        {analysis && (
          <div className="result">
            <h2>Analysis Details</h2>

            <div className="card">
              <h3>Summary</h3>
              <p>{analysis.summary}</p>
            </div>

            <div className="card">
              <h3>Matching Skills</h3>
              <ul>
                {analysis.matching_skills.map((skill, index) => (
                  <li key={index}>{skill}</li>
                ))}
              </ul>
            </div>

            <div className="card">
              <h3>Missing Skills</h3>
              <ul>
                {analysis.missing_skills.map((skill, index) => (
                  <li key={index}>{skill}</li>
                ))}
              </ul>
            </div>

            <div className="card">
              <h3>Suggestions</h3>
              <ul>
                {analysis.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="history">
          <h2>Saved Analyses</h2>

          {historyLoading ? (
            <p>Loading saved analyses...</p>
          ) : savedAnalyses.length === 0 ? (
            <p>No saved analyses yet.</p>
          ) : (
            savedAnalyses.map((item) => (
              <div className="card" key={item.id}>
                <h3>{item.filename}</h3>
                <p><strong>ID:</strong> {item.id}</p>
                <p>{item.summary}</p>

                <div className="actions">
                  <button onClick={() => handleViewAnalysis(item.id)}>View</button>
                  <button onClick={() => handleDelete(item.id)}>Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default App;