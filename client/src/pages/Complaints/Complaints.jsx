
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import "./Complaints.css";

const DASHBOARD_PATH = "/dashboard";

function Complaint() {
  const navigate = useNavigate();

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ==========================================
  // DASHBOARD NAVIGATION
  // ==========================================

  const goToDashboard = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    navigate(DASHBOARD_PATH);
  };

  // ==========================================
  // COMPLAINT SUBMISSION
  // ==========================================

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

      const storedUser = localStorage.getItem("user");
      const token = localStorage.getItem("token");

      if (!storedUser || !token) {
        setError("Please login first.");
        return;
      }

      let user;

      try {
        user = JSON.parse(storedUser);
      } catch {
        setError(
          "User information is invalid. Please login again."
        );
        return;
      }

      if (!user?.fullName || !user?.email) {
        setError(
          "User details are missing. Please login again."
        );
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
    } catch (err) {
      console.error("Complaint Error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to submit complaint."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="complaints-page">
      {/* =====================================
          NAVBAR
      ===================================== */}

      <nav className="complaints-navbar">
        <button
          type="button"
          className="complaints-logo"
          onClick={goToDashboard}
          aria-label="Go to Dashboard"
        >
          <span>🛍️</span>
          <span>C-Mart</span>
        </button>

        <div className="complaints-nav-links">
          <button
            type="button"
            onClick={goToDashboard}
          >
            Home
          </button>

          <button
            type="button"
            onClick={() => navigate("/products")}
          >
            Marketplace
          </button>

          <button
            type="button"
            onClick={() => navigate("/orders")}
          >
            Orders
          </button>

          <button
            type="button"
            onClick={() => navigate("/profile")}
          >
            Profile
          </button>
        </div>
      </nav>

      {/* =====================================
          MAIN CONTENT
      ===================================== */}

      <main className="complaints-container">
        <div className="complaints-card">
          {/* HEADER */}

          <div className="complaints-header">
            <div className="complaints-icon">
              ⚠️
            </div>

            <p className="complaints-label">
              C-MART SUPPORT
            </p>

            <h1>Submit a Complaint</h1>

            <p>
              Tell us about your issue and our team
              will review it carefully.
            </p>
          </div>

          {/* =====================================
              COMPLAINT FORM
          ===================================== */}

          <form
            onSubmit={handleSubmit}
            className="complaints-form"
          >
            {/* SUBJECT */}

            <div className="complaint-group">
              <label htmlFor="complaint-subject">
                Complaint Subject
                <span> *</span>
              </label>

              <input
                id="complaint-subject"
                type="text"
                placeholder="Example: Problem with my order"
                value={subject}
                onChange={(e) =>
                  setSubject(e.target.value)
                }
                maxLength={150}
                required
                disabled={loading}
              />
            </div>

            {/* DESCRIPTION */}

            <div className="complaint-group">
              <label htmlFor="complaint-description">
                Complaint Description
                <span> *</span>
              </label>

              <textarea
                id="complaint-description"
                placeholder="Describe your complaint or issue in detail..."
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
                rows={7}
                required
                disabled={loading}
              />
            </div>

            {/* SUCCESS MESSAGE */}

            {message && (
              <div
                className="complaint-success"
                role="status"
              >
                <span>✅</span>

                <div>
                  <strong>Success!</strong>
                  <p>{message}</p>
                </div>
              </div>
            )}

            {/* ERROR MESSAGE */}

            {error && (
              <div
                className="complaint-error"
                role="alert"
              >
                <span>❌</span>

                <div>
                  <strong>Unable to submit</strong>
                  <p>{error}</p>
                </div>
              </div>
            )}

            {/* SUBMIT BUTTON */}

            <button
              type="submit"
              className="complaint-submit-btn"
              disabled={loading}
            >
              {loading
                ? "Submitting..."
                : "Submit Complaint →"}
            </button>
          </form>

          {/* =====================================
              INFORMATION
          ===================================== */}

          <div className="complaints-info">
            <div className="info-item">
              <span>🛡️</span>

              <div>
                <strong>
                  Your complaint is safe
                </strong>

                <p>
                  Your complaint will be reviewed by
                  the C-Mart team.
                </p>
              </div>
            </div>

            <div className="info-item">
              <span>📩</span>

              <div>
                <strong>Admin Review</strong>

                <p>
                  The admin can review your complaint
                  from the Admin Panel.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* =====================================
          FOOTER
      ===================================== */}

      <footer className="complaints-footer">
        <div className="footer-logo">
          🛍️ C-Mart
        </div>

        <p>
          Campus Marketplace • Buy • Sell • Swap • Rent
        </p>
      </footer>
    </div>
  );
}

export default Complaint;
