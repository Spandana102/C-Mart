
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../services/api";
import "./Register.css";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    collegeId: "189",
    phoneNumber: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    const fullName = formData.fullName.trim();
    const email = formData.email.trim().toLowerCase();
    const password = formData.password;
    const phoneNumber = formData.phoneNumber.trim();

    if (fullName.length < 2) {
      alert("Full name must contain at least 2 characters.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      alert("Password must contain at least 6 characters.");
      return;
    }

    if (!/^\d{10}$/.test(phoneNumber)) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }

    try {
      setLoading(true);

      const response = await API.post("/auth/register", {
        fullName,
        email,
        password,
        phoneNumber,
      });

      alert(
        response.data.message ||
        "Registration successful!"
      );

      navigate("/login-selection", {
        replace: true,
      });

    } catch (error) {
      console.error(
        "Registration Error:",
        error.response?.data || error.message
      );

      const status = error.response?.status;
      const message = error.response?.data?.message;

      if (status === 409) {
        alert(
          message ||
          "This account already exists. Please login."
        );
      } else if (status === 400) {
        alert(
          message ||
          "Please check your registration details."
        );
      } else if (!error.response) {
        alert(
          "Unable to connect to the server. Please check your internet connection."
        );
      } else {
        alert(
          message ||
          "Registration failed. Please try again."
        );
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">

      <div className="register-card">

        {/* HEADER */}

        <div className="register-header">

          <div className="brand-icon">🛍️</div>

          <h1>C-Mart</h1>

          <h2>Create Account</h2>

          <p>Join your campus marketplace</p>

        </div>

        {/* REGISTRATION FORM */}

        <form onSubmit={handleSubmit}>

          {/* FULL NAME */}

          <div className="form-group">

            <label>Full Name</label>

            <input
              type="text"
              name="fullName"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={handleChange}
              style={{
                letterSpacing: "normal",
                wordSpacing: "normal",
              }}
              minLength={2}
              maxLength={100}
              autoComplete="name"
              required
            />

          </div>

          {/* EMAIL */}

          <div className="form-group">

            <label>Email Address</label>

            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              style={{
                letterSpacing: "normal",
                wordSpacing: "normal",
              }}
              autoComplete="email"
              required
            />

          </div>

          {/* PASSWORD */}

          <div className="form-group">

            <label>Password</label>

            <input
              type="password"
              name="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
              style={{
                letterSpacing: "normal",
                wordSpacing: "normal",
              }}
              minLength={6}
              autoComplete="new-password"
              required
            />

          </div>

          {/* COLLEGE ID */}

          <div className="form-group">

            <label>College ID</label>

            <input
              type="text"
              name="collegeId"
              value="189"
              readOnly
              style={{
                letterSpacing: "normal",
                wordSpacing: "normal",
                cursor: "not-allowed",
              }}
            />

          </div>

          {/* PHONE NUMBER */}

          <div className="form-group">

            <label>Phone Number</label>

            <input
              type="tel"
              name="phoneNumber"
              placeholder="Enter your phone number"
              value={formData.phoneNumber}
              onChange={handleChange}
              style={{
                letterSpacing: "normal",
                wordSpacing: "normal",
              }}
              inputMode="numeric"
              maxLength={10}
              pattern="[0-9]{10}"
              autoComplete="tel"
              required
            />

          </div>

          {/* SUBMIT BUTTON */}

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Creating Account..."
              : "Create Account"}
          </button>

        </form>

        {/* EXISTING USER LOGIN */}

        <div className="login-link">

          <p>Already have an account?</p>

          <Link to="/login-selection">
            Login
          </Link>

        </div>

      </div>

    </div>
  );
}

export default Register;
