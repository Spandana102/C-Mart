import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import "./Complaints.css";

function Complaint() {
  const navigate = useNavigate();

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

      const storedUser = localStorage.getItem("user");

      if (!storedUser) {
        setError("Please login first.");
        return;
      }

      const user = JSON.parse(storedUser);

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

      {/* NAVBAR */}
      <nav className="complaints-navbar">

        <div
          className="complaints-logo"
          onClick={() => navigate("/")}
        >
          <span>🛍️</span>
          <span>C-Mart</span>
        </div>

        <div className="complaints-nav-links">
          <button onClick={() => navigate("/")}>
            Home
          </button>

          <button onClick={() => navigate("/products")}>
            Marketplace
          </button>

          <button onClick={() => navigate("/orders")}>
            Orders
          </button>

          <button onClick={() => navigate("/profile")}>
            Profile
          </button>
        </div>

      </nav>


      {/* MAIN CONTENT */}
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

            <h1>
              Submit a Complaint
            </h1>

            <p>
              Tell us about your issue and our team
              will review it carefully.
            </p>

          </div>


          {/* FORM */}
          <form
            onSubmit={handleSubmit}
            className="complaints-form"
          >

            {/* SUBJECT */}
            <div className="complaint-group">

              <label>
                Complaint Subject
                <span>*</span>
              </label>

              <input
                type="text"
                placeholder="Example: Problem with my order"
                value={subject}
                onChange={(e) =>
                  setSubject(e.target.value)
                }
              />

            </div>


            {/* DESCRIPTION */}
            <div className="complaint-group">

              <label>
                Complaint Description
                <span>*</span>
              </label>

              <textarea
                placeholder="Describe your complaint or issue in detail..."
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
                rows="7"
              />

            </div>


            {/* SUCCESS MESSAGE */}
            {message && (
              <div className="complaint-success">
                <span>✅</span>
                <div>
                  <strong>Success!</strong>
                  <p>{message}</p>
                </div>
              </div>
            )}


            {/* ERROR MESSAGE */}
            {error && (
              <div className="complaint-error">
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


          {/* INFORMATION */}
          <div className="complaints-info">

            <div className="info-item">
              <span>🛡️</span>
              <div>
                <strong>Your complaint is safe</strong>
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


      {/* FOOTER */}
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