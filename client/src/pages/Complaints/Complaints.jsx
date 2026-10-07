import { useState } from "react";
import API from "../../services/api";
import "./Complaints.css";

function Complaint() {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!subject.trim() || !description.trim()) {
      setError("Please fill all fields.");
      return;
    }

    try {
      setLoading(true);

      const user = JSON.parse(localStorage.getItem("user"));

      if (!user) {
        setError("Please login first.");
        return;
      }

      await API.post("/complaints", {
        userName: user.fullName,
        userEmail: user.email,
        subject: subject.trim(),
        description: description.trim(),
      });

      setMessage("Complaint submitted successfully!");

      setSubject("");
      setDescription("");
    } catch (error) {
      console.error("Complaint Error:", error);

      setError(
        error.response?.data?.message ||
          "Failed to submit complaint."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="complaints-page">
      <div className="complaints-card">

        <div className="complaints-header">
          <div className="complaints-icon">⚠️</div>

          <h1>Submit a Complaint</h1>

          <p>
            Tell us about your issue and our team will review it.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="complaints-form">

          <div className="complaint-group">
            <label>Subject</label>

            <input
              type="text"
              placeholder="Enter complaint subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="complaint-group">
            <label>Description</label>

            <textarea
              placeholder="Describe your complaint in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="6"
            />
          </div>

          {message && (
            <div className="complaint-success">
              ✅ {message}
            </div>
          )}

          {error && (
            <div className="complaint-error">
              ❌ {error}
            </div>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Submitting..." : "Submit Complaint"}
          </button>

        </form>

        <div className="complaints-footer">
          <span>🛡️</span>
          Your complaint will be reviewed by the C-Mart team.
        </div>

      </div>
    </div>
  );
}

export default Complaint;