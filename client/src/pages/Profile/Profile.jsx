
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import "./Profile.css";

const DASHBOARD_PATH = "/dashboard";

const emptyForm = {
  fullName: "",
  email: "",
  collegeId: "",
  phoneNumber: "",
};

const getProfileForm = (profile) => ({
  fullName: profile?.fullName || "",
  email: profile?.email || "",
  collegeId: profile?.collegeId || "",
  phoneNumber: profile?.phoneNumber || "",
});

function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState(emptyForm);

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
  // FETCH PROFILE
  // ==========================================

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      const response = await API.get("/auth/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const profile = response.data?.user;

      if (!profile) {
        throw new Error("Profile information not found.");
      }

      setUser(profile);
      setFormData(getProfileForm(profile));
    } catch (err) {
      console.error("Fetch Profile Error:", err);

      if (err.response?.status === 401) {
        setError("Session expired. Please log in again.");
      } else {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load profile."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // ==========================================
  // INPUT CHANGE
  // ==========================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ==========================================
  // EDIT PROFILE
  // ==========================================

  const handleEdit = () => {
    setError("");
    setSuccess("");
    setEditing(true);
  };

  // ==========================================
  // CANCEL EDIT
  // ==========================================

  const handleCancel = () => {
    if (!user) return;

    setFormData(getProfileForm(user));
    setEditing(false);
    setError("");
  };

  // ==========================================
  // UPDATE PROFILE
  // ==========================================

  const handleUpdate = async (event) => {
    event.preventDefault();

    const updatedData = {
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      collegeId: formData.collegeId.trim(),
      phoneNumber: formData.phoneNumber.trim(),
    };

    if (Object.values(updatedData).some((value) => !value)) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      const response = await API.put(
        "/auth/profile",
        updatedData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedUser = response.data?.user;

      if (!updatedUser) {
        throw new Error(
          "Updated profile was not returned."
        );
      }

      setUser(updatedUser);
      setFormData(getProfileForm(updatedUser));

      // Keep localStorage user details updated.
      try {
        const stored = JSON.parse(
          localStorage.getItem("user") || "{}"
        );

        const mergedUser = stored?.user
          ? {
              ...stored,
              user: {
                ...stored.user,
                ...updatedUser,
              },
            }
          : {
              ...stored,
              ...updatedUser,
            };

        localStorage.setItem(
          "user",
          JSON.stringify(mergedUser)
        );
      } catch {
        localStorage.setItem(
          "user",
          JSON.stringify(updatedUser)
        );
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

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login", { replace: true });
  };

  // ==========================================
  // HELPERS
  // ==========================================

  const getInitials = (name) => {
    if (!name || typeof name !== "string") return "U";

    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  };

  const displayValue = (value) =>
    value === null ||
    value === undefined ||
    String(value).trim() === ""
      ? "Not provided"
      : value;

  // ==========================================
  // PROFILE UI
  // ==========================================

  return (
    <div className="profile-page">
      {/* NAVBAR */}

      <nav className="profile-navbar">
        <button
          type="button"
          className="profile-brand"
          onClick={goToDashboard}
        >
          <span>🛍️</span>
          <span>C-Mart</span>
        </button>

        <div className="profile-nav-links">
          <button type="button" onClick={goToDashboard}>
            Home
          </button>

          <button
            type="button"
            onClick={() => navigate("/orders")}
          >
            Orders
          </button>

          <button
            type="button"
            className="profile-nav-active"
            aria-current="page"
          >
            Profile
          </button>

          <button
            type="button"
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
            <p className="profile-eyebrow">MY ACCOUNT</p>

            <h1>
              My <span>Profile</span>
            </h1>

            <p>
              Manage your personal information and campus
              marketplace account.
            </p>
          </div>

          <button
            type="button"
            className="profile-back-btn"
            onClick={goToDashboard}
          >
            ← Dashboard
          </button>
        </div>

        {/* ALERTS */}

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

        {/* PROFILE CONTENT */}

        {loading ? (
          <div className="profile-loading">
            <div className="profile-loading-icon">👤</div>
            <h2>Loading your profile...</h2>
            <p>Please wait a moment.</p>
          </div>
        ) : !user ? (
          <div className="profile-loading">
            <div className="profile-loading-icon">⚠️</div>
            <h2>Profile not available</h2>

            <button
              type="button"
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

                <h2>{displayValue(user.fullName)}</h2>

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
                  type="button"
                  className="profile-sidebar-dashboard"
                  onClick={goToDashboard}
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
                    type="button"
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
                        Keep your contact information updated
                        for smooth campus transactions.
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                /* EDIT PROFILE FORM */

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
                        disabled={saving}
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
                        disabled={saving}
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
                        disabled={saving}
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
                        disabled={saving}
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

      {/* FOOTER */}

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
