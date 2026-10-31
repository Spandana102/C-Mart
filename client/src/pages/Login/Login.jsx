
import { useState } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import { GoogleLogin } from "@react-oauth/google";
import API from "../../services/api";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const loginType =
    searchParams.get("role") === "admin"
      ? "admin"
      : "user";

  const isAdmin = loginType === "admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ====================================
  // LOGIN SUCCESS
  // ====================================

  const handleLoginSuccess = (data) => {
    const { token, user } = data || {};

    if (!token || !user) {
      throw new Error(
        "Login failed. User information is missing."
      );
    }

    const actualRole = String(
      user.role || "user"
    ).toLowerCase();

    if (isAdmin && actualRole !== "admin") {
      throw new Error(
        "Access denied. This account is not an administrator."
      );
    }

    if (!isAdmin && actualRole !== "user") {
      throw new Error(
        "Please use Admin Login for this account."
      );
    }

    localStorage.setItem("token", token);
    localStorage.setItem(
      "user",
      JSON.stringify(user)
    );

    navigate(
      actualRole === "admin"
        ? "/admin"
        : "/dashboard",
      { replace: true }
    );
  };

  // ====================================
  // EMAIL LOGIN
  // ====================================

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await API.post("/auth/login", {
        email: email.trim(),
        password,
        loginType,
      });

      handleLoginSuccess(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ====================================
  // GOOGLE LOGIN
  // ====================================

  const handleGoogleLogin = async (response) => {
    setError("");

    if (!response?.credential) {
      setError("Google authentication failed.");
      return;
    }

    try {
      setLoading(true);

      const result = await API.post("/auth/google", {
        credential: response.credential,
        loginType,
      });

      handleLoginSuccess(result.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Google login failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`login-page ${
        isAdmin ? "admin-login-page" : "user-login-page"
      }`}
    >
      <div className="login-background-shape shape-a" />
      <div className="login-background-shape shape-b" />

      <main className="login-layout">

        {/* LEFT INFORMATION PANEL */}

        <section className="login-info-panel">
          <Link to="/" className="login-brand">
            <span className="login-brand-symbol">
              🛍️
            </span>
            <span>C-MART</span>
          </Link>

          <div className="login-info-content">
            <span className="login-eyebrow">
              {isAdmin
                ? "CAMPUS MARKETPLACE MANAGEMENT"
                : "YOUR CAMPUS MARKETPLACE"}
            </span>

            <h1>
              {isAdmin
                ? "Manage Your Campus Marketplace"
                : "Everything Your Campus Needs"}
            </h1>

            <p>
              {isAdmin
                ? "Securely manage students, products, complaints and marketplace reports from one place."
                : "Buy, sell, swap and rent useful products with students from your campus."}
            </p>

            <div className="login-feature-list">
              {isAdmin ? (
                <>
                  <div>✓ Manage Users and Products</div>
                  <div>✓ Review Complaints and Reports</div>
                  <div>✓ Monitor Marketplace Activities</div>
                </>
              ) : (
                <>
                  <div>✓ Buy and Sell Products</div>
                  <div>✓ Swap, Rent and Bargain</div>
                  <div>✓ Connect with Campus Students</div>
                </>
              )}
            </div>
          </div>

          <p className="login-panel-footer">
            C-MART © 2026
          </p>
        </section>

        {/* RIGHT LOGIN PANEL */}

        <section className="login-form-panel">
          <div className="login-card">

            <div className="login-header">
              <div className="login-role-icon">
                {isAdmin ? "🛡️" : "🎓"}
              </div>

              <span className="login-role-label">
                {isAdmin
                  ? "ADMINISTRATOR ACCESS"
                  : "STUDENT ACCESS"}
              </span>

              <h2>
                {isAdmin ? "Admin Login" : "User Login"}
              </h2>

              <p>
                {isAdmin
                  ? "Enter your administrator credentials"
                  : "Welcome back! Sign in to continue"}
              </p>
            </div>

            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="login-form"
            >
              <div className="login-field">
                <label htmlFor="login-email">
                  {isAdmin
                    ? "Admin Email Address"
                    : "Email Address"}
                </label>

                <input
                  id="login-email"
                  type="email"
                  placeholder={
                    isAdmin
                      ? "Enter your admin email"
                      : "Enter your email"
                  }
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  autoComplete="email"
                  required
                />
              </div>

              <div className="login-field">
                <div className="login-password-heading">
                  <label htmlFor="login-password">
                    Password
                  </label>

                  <Link to="/forgot-password">
                    Forgot Password?
                  </Link>
                </div>

                <div className="login-password-wrapper">
                  <input
                    id="login-password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    autoComplete="current-password"
                    required
                  />

                  <button
                    type="button"
                    className="login-show-password"
                    onClick={() =>
                      setShowPassword((prev) => !prev)
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="login-submit-button"
                disabled={loading}
              >
                {loading
                  ? "Signing in..."
                  : isAdmin
                  ? "Login as Admin"
                  : "Login as User"}
              </button>
            </form>

            <div className="login-divider">
              <span>or continue with</span>
            </div>

            <div className="google-login-section">
              <div className="google-button-container">
                <GoogleLogin
                  onSuccess={handleGoogleLogin}
                  onError={() =>
                    setError(
                      "Google sign-in failed. Please try again."
                    )
                  }
                  theme="outline"
                  size="large"
                  shape="rectangular"
                  text="continue_with"
                  width="300"
                />
              </div>
            </div>

            {!isAdmin && (
              <p className="login-register-text">
                Don't have an account?{" "}
                <Link to="/register">
                  Create Account
                </Link>
              </p>
            )}

            <div className="login-bottom-links">
              <Link to="/">
                ← Back to Login Selection
              </Link>

              <Link
                to={
                  isAdmin
                    ? "/login?role=user"
                    : "/login?role=admin"
                }
                onClick={() => {
                  setError("");
                  setEmail("");
                  setPassword("");
                }}
              >
                {isAdmin
                  ? "Student Login"
                  : "Admin Login"}
              </Link>
            </div>

          </div>
        </section>
      </main>
    </div>
  );
}

export default Login;
