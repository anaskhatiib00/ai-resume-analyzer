import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

function getGuestId() {
  let guestId = localStorage.getItem("guest_id");

  if (!guestId) {
    guestId = crypto.randomUUID();
    localStorage.setItem("guest_id", guestId);
  }

  return guestId;
}

function getErrorMessage(err) {
  if (typeof err === "string") return err;
  if (err?.message) return err.message;
  return JSON.stringify(err);
}

function App() {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [latestAnalysis, setLatestAnalysis] = useState(null);
  const [savedAnalyses, setSavedAnalyses] = useState([]);
  const [expandedAnalysisId, setExpandedAnalysisId] = useState(null);
  const [expandedAnalysisData, setExpandedAnalysisData] = useState(null);
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
      setError(getErrorMessage(err));
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
    setLatestAnalysis(null);

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

      setLatestAnalysis(data.analysis);
      setExpandedAnalysisId(null);
      setExpandedAnalysisData(null);
      fetchAnalyses();
    } catch (err) {
      setError(getErrorMessage(err));
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

      if (expandedAnalysisId === analysisId) {
        setExpandedAnalysisId(null);
        setExpandedAnalysisData(null);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleViewAnalysis = async (analysisId) => {
    try {
      if (expandedAnalysisId === analysisId) {
        setExpandedAnalysisId(null);
        setExpandedAnalysisData(null);
        return;
      }

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

      setExpandedAnalysisId(analysisId);
      setExpandedAnalysisData(data);
    } catch (err) {
      setError(getErrorMessage(err));
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
            className="job-textarea"
            placeholder="Paste the job description here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />

          <button type="submit" disabled={loading}>
            {loading ? "Analyzing..." : "Analyze Resume"}
          </button>
        </form>

        {error && <p className="error">{error}</p>}

        {latestAnalysis && (
          <div className="result">
            <h2>Latest Analysis</h2>

            <div className="card">
              <h3>Summary</h3>
              <p>{latestAnalysis.summary}</p>
            </div>

            <div className="card">
              <h3>Matching Skills</h3>
              <ul>
                {latestAnalysis.matching_skills.map((skill, index) => (
                  <li key={index}>{skill}</li>
                ))}
              </ul>
            </div>

            <div className="card">
              <h3>Missing Skills</h3>
              <ul>
                {latestAnalysis.missing_skills.map((skill, index) => (
                  <li key={index}>{skill}</li>
                ))}
              </ul>
            </div>

            <div className="card">
              <h3>Suggestions</h3>
              <ul>
                {latestAnalysis.suggestions.map((suggestion, index) => (
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
              <div className="card history-card" key={item.id}>
                <div className="history-header">
                  <div>
                    <h3>{item.filename}</h3>
                    <p><strong>ID:</strong> {item.id}</p>
                    <p>{item.summary}</p>
                  </div>
                </div>

                <div className="actions">
                  <button onClick={() => handleViewAnalysis(item.id)}>
                    {expandedAnalysisId === item.id ? "Hide" : "View"}
                  </button>
                  <button onClick={() => handleDelete(item.id)}>Delete</button>
                </div>

                {expandedAnalysisId === item.id && expandedAnalysisData && (
                  <div className="expanded-analysis">
                    <div className="card inner-card">
                      <h3>Summary</h3>
                      <p>{expandedAnalysisData.summary}</p>
                    </div>

                    <div className="card inner-card">
                      <h3>Matching Skills</h3>
                      <ul>
                        {expandedAnalysisData.matching_skills.map((skill, index) => (
                          <li key={index}>{skill}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="card inner-card">
                      <h3>Missing Skills</h3>
                      <ul>
                        {expandedAnalysisData.missing_skills.map((skill, index) => (
                          <li key={index}>{skill}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="card inner-card">
                      <h3>Suggestions</h3>
                      <ul>
                        {expandedAnalysisData.suggestions.map((suggestion, index) => (
                          <li key={index}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default App;