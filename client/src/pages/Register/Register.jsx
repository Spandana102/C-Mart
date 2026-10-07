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
    collegeId: "",
    phoneNumber: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await API.post(
        "/auth/register",
        {
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          password: formData.password,
          collegeId: formData.collegeId.trim(),
          phoneNumber: formData.phoneNumber.trim(),
        }
      );

      alert(
        response.data.message ||
        "Registration successful!"
      );

      navigate("/login");

    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Registration failed"
      );
    }
  };

  return (
    <div className="register-page">

      <div className="register-card">

        <div className="register-header">

          <div className="brand-icon">🛍️</div>

          <h1>C-Mart</h1>

          <h2>Create Account</h2>

          <p>Join your campus marketplace</p>

        </div>

        <form onSubmit={handleSubmit}>

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
                wordSpacing: "normal"
              }}
              required
            />

          </div>

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
                wordSpacing: "normal"
              }}
              required
            />

          </div>

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
                wordSpacing: "normal"
              }}
              required
            />

          </div>

          <div className="form-group">

            <label>College ID</label>

            <input
              type="text"
              name="collegeId"
              placeholder="Enter your college ID"
              value={formData.collegeId}
              onChange={handleChange}
              style={{
                letterSpacing: "normal",
                wordSpacing: "normal"
              }}
              required
            />

          </div>

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
                wordSpacing: "normal"
              }}
              required
            />

          </div>

          <button type="submit">
            Create Account
          </button>

        </form>

        <div className="login-link">

          <p>Already have an account?</p>

          <Link to="/login">
            Login
          </Link>

        </div>

      </div>

    </div>
  );
}

export default Register;