import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../services/api";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      alert("Please enter email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await API.post("/auth/login", {
        email: email.trim(),
        password: password,
      });

      console.log("Login response:", response.data);

      // Check token
      if (!response.data?.token) {
        throw new Error("Login successful but token was not received.");
      }

      // Save token
      localStorage.setItem("token", response.data.token);

      // Get logged-in user details
      const user = response.data?.user;

      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      }

      alert("Login successful!");

      // Redirect based on user role
      if (user?.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }

    } catch (error) {
      console.error("Login error:", error);

      alert(
        error.response?.data?.message ||
          error.message ||
          "Invalid email or password"
      );
    } finally {
      setLoading(false);
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

          <div className="forgot-password">
            <Link to="/forgot-password">
              Forgot Password?
            </Link>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
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