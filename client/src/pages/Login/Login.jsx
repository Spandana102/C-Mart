import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../../services/api";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await API.post("/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", response.data.token);

      alert("Login successful!");
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Invalid email or password"
      );
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

        <div className="login-header">
          <div className="brand-icon">🛍️</div>

          <h1>C-Mart</h1>

          <h2>Welcome Back!</h2>

          <p>Login to your C-Mart account</p>
        </div>

        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label>Email Address</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit">
            Login
          </button>

        </form>

        <div className="register-link">
          <p>Don't have an account?</p>

          <Link to="/register">
            Create an Account
          </Link>
        </div>

      </div>
    </div>
  );
}

export default Login;