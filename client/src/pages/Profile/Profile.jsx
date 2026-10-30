
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import "./Profile.css";

function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    collegeId: "",
    phoneNumber: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await API.get("/auth/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const profile = response.data.user;

      if (!profile) {
        throw new Error("Profile information not found.");
      }

      setUser(profile);

      setFormData({
        fullName: profile.fullName || "",
        email: profile.email || "",
        collegeId: profile.collegeId || "",
        phoneNumber: profile.phoneNumber || "",
      });
    } catch (err) {
      console.error("Fetch Profile Error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load profile."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleEdit = () => {
    setError("");
    setSuccess("");
    setEditing(true);
  };

  const handleCancel = () => {
    setFormData({
      fullName: user.fullName || "",
      email: user.email || "",
      collegeId: user.collegeId || "",
      phoneNumber: user.phoneNumber || "",
    });

    setEditing(false);
    setError("");
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (
      !formData.fullName.trim() ||
      !formData.email.trim() ||
      !formData.collegeId.trim() ||
      !formData.phoneNumber.trim()
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const token = localStorage.getItem("token");

      const response = await API.put(
        "/auth/profile",
        {
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          collegeId: formData.collegeId.trim(),
          phoneNumber: formData.phoneNumber.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedUser = response.data.user;

      if (!updatedUser) {
        throw new Error("Updated profile was not returned.");
      }

      setUser(updatedUser);

      setFormData({
        fullName: updatedUser.fullName || "",
        email: updatedUser.email || "",
        collegeId: updatedUser.collegeId || "",
        phoneNumber: updatedUser.phoneNumber || "",
      });

      // Keep user information synchronized
      const storedUser = localStorage.getItem("user");

      if (storedUser) {
        try {
          const oldUser = JSON.parse(storedUser);

          localStorage.setItem(
            "user",
            JSON.stringify({
              ...oldUser,
              ...updatedUser,
            })
          );
        } catch {
          localStorage.setItem(
            "user",
            JSON.stringify(updatedUser)
          );
        }
      }

      setEditing(false);
      setSuccess("Profile updated successfully!");
    } catch (err) {
      console.error("Update Profile Error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  const getInitials = (name) => {
    if (!name) return "U";

    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  };

  const displayValue = (value) =>
    value ? value : "Not provided";

  return (
    <div className="profile-page">
      {/* NAVBAR */}

      <nav className="profile-navbar">
        <button
          type="button"
          className="profile-brand"
          onClick={() => navigate("/")}
        >
          <span>🛍️</span>
          <span>C-Mart</span>
        </button>

        <div className="profile-nav-links">
          <button onClick={() => navigate("/")}>
            Home
          </button>

          <button onClick={() => navigate("/orders")}>
            Orders
          </button>

          <button className="profile-nav-active">
            Profile
          </button>

          <button
            className="profile-nav-logout"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="profile-main">
        {/* PAGE HEADING */}

        <div className="profile-page-heading">
          <div>
            <p className="profile-eyebrow">
              MY ACCOUNT
            </p>

            <h1>
              My <span>Profile</span>
            </h1>

            <p>
              Manage your personal information and
              campus marketplace account.
            </p>
          </div>

          <button
            className="profile-back-btn"
            onClick={() => navigate("/")}
          >
            ← Dashboard
          </button>
        </div>

        {/* ERROR / SUCCESS */}

        {error && (
          <div className="profile-alert error" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="profile-alert success" role="status">
            ✓ {success}
          </div>
        )}

        {/* LOADING */}

        {loading ? (
          <div className="profile-loading">
            <div className="profile-loading-icon">
              👤
            </div>
            <h2>Loading your profile...</h2>
            <p>Please wait a moment.</p>
          </div>
        ) : !user ? (
          <div className="profile-loading">
            <h2>Profile not available</h2>

            <button
              className="edit-button"
              onClick={fetchProfile}
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="profile-layout">
            {/* LEFT PROFILE CARD */}

            <aside className="profile-sidebar">
              <div className="profile-cover" />

              <div className="profile-sidebar-content">
                <div className="profile-avatar">
                  {getInitials(user.fullName)}
                </div>

                <h2>
                  {displayValue(user.fullName)}
                </h2>

                <p className="profile-sidebar-email">
                  {displayValue(user.email)}
                </p>

                <span className="profile-role-badge">
                  {user.role === "admin"
                    ? "Administrator"
                    : "Student Member"}
                </span>

                <div className="profile-sidebar-divider" />

                <div className="profile-mini-info">
                  <div>
                    <span>🎓</span>

                    <div>
                      <small>College ID</small>
                      <strong>
                        {displayValue(user.collegeId)}
                      </strong>
                    </div>
                  </div>

                  <div>
                    <span>📱</span>

                    <div>
                      <small>Phone Number</small>
                      <strong>
                        {displayValue(user.phoneNumber)}
                      </strong>
                    </div>
                  </div>
                </div>

                <button
                  className="profile-sidebar-dashboard"
                  onClick={() => navigate("/")}
                >
                  Go to Dashboard →
                </button>
              </div>
            </aside>

            {/* RIGHT INFORMATION CARD */}

            <section className="profile-card">
              <div className="profile-card-header">
                <div>
                  <p className="profile-section-label">
                    ACCOUNT DETAILS
                  </p>

                  <h2>
                    {editing
                      ? "Edit Personal Information"
                      : "Personal Information"}
                  </h2>

                  <p>
                    {editing
                      ? "Update your details below."
                      : "Your registered C-Mart account information."}
                  </p>
                </div>

                {!editing && (
                  <button
                    className="edit-button"
                    onClick={handleEdit}
                  >
                    ✎ Edit Profile
                  </button>
                )}
              </div>

              {!editing ? (
                <>
                  <div className="profile-info">
                    <div className="profile-row">
                      <div className="profile-field-icon">
                        👤
                      </div>

                      <div className="profile-field-text">
                        <strong>Full Name</strong>
                        <span>
                          {displayValue(user.fullName)}
                        </span>
                      </div>
                    </div>

                    <div className="profile-row">
                      <div className="profile-field-icon">
                        ✉️
                      </div>

                      <div className="profile-field-text">
                        <strong>Email Address</strong>
                        <span>
                          {displayValue(user.email)}
                        </span>
                      </div>
                    </div>

                    <div className="profile-row">
                      <div className="profile-field-icon">
                        🎓
                      </div>

                      <div className="profile-field-text">
                        <strong>College ID</strong>
                        <span>
                          {displayValue(user.collegeId)}
                        </span>
                      </div>
                    </div>

                    <div className="profile-row">
                      <div className="profile-field-icon">
                        📱
                      </div>

                      <div className="profile-field-text">
                        <strong>Phone Number</strong>
                        <span>
                          {displayValue(user.phoneNumber)}
                        </span>
                      </div>
                    </div>

                    <div className="profile-row">
                      <div className="profile-field-icon">
                        🛡️
                      </div>

                      <div className="profile-field-text">
                        <strong>Account Role</strong>
                        <span>
                          {user.role === "admin"
                            ? "Administrator"
                            : user.role || "Student"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="profile-account-note">
                    <span>🔒</span>

                    <div>
                      <strong>Account Information</strong>
                      <p>
                        Keep your contact information
                        updated for smooth campus
                        transactions.
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <form
                  className="profile-form"
                  onSubmit={handleUpdate}
                >
                  <div className="profile-form-grid">
                    <div className="profile-input-group">
                      <label htmlFor="profile-fullName">
                        Full Name
                      </label>

                      <input
                        id="profile-fullName"
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="Enter full name"
                        maxLength={100}
                        required
                      />
                    </div>

                    <div className="profile-input-group">
                      <label htmlFor="profile-email">
                        Email Address
                      </label>

                      <input
                        id="profile-email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter email address"
                        required
                      />
                    </div>

                    <div className="profile-input-group">
                      <label htmlFor="profile-collegeId">
                        College ID
                      </label>

                      <input
                        id="profile-collegeId"
                        type="text"
                        name="collegeId"
                        value={formData.collegeId}
                        onChange={handleChange}
                        placeholder="Enter college ID"
                        required
                      />
                    </div>

                    <div className="profile-input-group">
                      <label htmlFor="profile-phoneNumber">
                        Phone Number
                      </label>

                      <input
                        id="profile-phoneNumber"
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        placeholder="Enter phone number"
                        required
                      />
                    </div>
                  </div>

                  <div className="profile-form-actions">
                    <button
                      type="button"
                      className="cancel-button"
                      onClick={handleCancel}
                      disabled={saving}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="update-button"
                      disabled={saving}
                    >
                      {saving
                        ? "Saving Changes..."
                        : "✓ Save Changes"}
                    </button>
                  </div>
                </form>
              )}
            </section>
          </div>
        )}
      </main>

      <footer className="profile-footer">
        <strong>🛍️ C-Mart</strong>

        <p>
          Campus Marketplace • Buy • Sell • Swap • Rent
        </p>
      </footer>
    </div>
  );
}

export default Profile;
