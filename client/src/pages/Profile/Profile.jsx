import { useEffect, useState } from "react";
import API from "../../services/api";
import "./Profile.css";

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

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
      const token = localStorage.getItem("token");

      const response = await API.get("/auth/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const profile = response.data.user;

      setUser(profile);

      setFormData({
        fullName: profile.fullName || "",
        email: profile.email || "",
        collegeId: profile.collegeId || "",
        phoneNumber: profile.phoneNumber || "",
      });
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to load profile"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");

      const response = await API.put(
        "/auth/profile",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUser(response.data.user);

      setEditing(false);

      alert("Profile updated successfully!");
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to update profile"
      );
    }
  };

  if (loading) {
    return <h2>Loading profile...</h2>;
  }

  if (!user) {
    return <h2>Profile not available</h2>;
  }

  return (
    <div className="profile-page">
      <div className="profile-card">

        <div className="profile-icon">
          👤
        </div>

        <h1>My Profile</h1>

        {!editing ? (
          <>
            <div className="profile-info">

              <div className="profile-row">
                <strong>Full Name</strong>
                <span>{user.fullName}</span>
              </div>

              <div className="profile-row">
                <strong>Email</strong>
                <span>{user.email}</span>
              </div>

              <div className="profile-row">
                <strong>College ID</strong>
                <span>{user.collegeId}</span>
              </div>

              <div className="profile-row">
                <strong>Phone Number</strong>
                <span>{user.phoneNumber}</span>
              </div>

              <div className="profile-row">
                <strong>Role</strong>
                <span>{user.role}</span>
              </div>

            </div>

            <button
              className="edit-button"
              onClick={() => setEditing(true)}
            >
              Edit Profile
            </button>
          </>
        ) : (
          <form
            className="profile-form"
            onSubmit={handleUpdate}
          >

            <label>Full Name</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
            />

            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <label>College ID</label>
            <input
              type="text"
              name="collegeId"
              value={formData.collegeId}
              onChange={handleChange}
              required
            />

            <label>Phone Number</label>
            <input
              type="text"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              required
            />

            <button
              type="submit"
              className="update-button"
            >
              Update Profile
            </button>

            <button
              type="button"
              className="cancel-button"
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>

          </form>
        )}
        <button
  className="logout-button"
  onClick={() => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  }}
>
  Logout
</button>

      </div>
    </div>
  );
}

export default Profile;