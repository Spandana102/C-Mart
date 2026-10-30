
import { useState } from "react";
import {
  useLocation,
  useNavigate,
  Link,
} from "react-router-dom";
import API from "../../services/api";

function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || "";
  const otp = location.state?.otp || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !otp) {
      setError("Please verify OTP again.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await API.post(
        "/auth/reset-password",
        {
          email,
          otp,
          newPassword,
        }
      );

      if (response.data.success) {
        alert("Password reset successful! Please login.");
        navigate("/login", { replace: true });
      } else {
        setError(
          response.data.message || "Password reset failed."
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to reset password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f3f6fb",
        padding: 20,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: 420,
          padding: 30,
          borderRadius: 16,
          background: "#fff",
          boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
        }}
      >
        <h2 style={{ color: "#2563eb" }}>
          C-Mart Reset Password
        </h2>

        <p style={{ color: "#64748b" }}>
          Enter your new password below.
        </p>

        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          minLength={6}
          required
          style={{
            width: "100%",
            padding: 12,
            marginBottom: 15,
            boxSizing: "border-box",
          }}
        />

        <input
          type="password"
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChange={(e) =>
            setConfirmPassword(e.target.value)
          }
          minLength={6}
          required
          style={{
            width: "100%",
            padding: 12,
            marginBottom: 15,
            boxSizing: "border-box",
          }}
        />

        {error && (
          <p style={{ color: "#dc2626" }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !email || !otp}
          style={{
            width: "100%",
            padding: 12,
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>

        <p style={{ textAlign: "center", marginTop: 20 }}>
          <Link to="/forgot-password">
            Back to Forgot Password
          </Link>
        </p>
      </form>
    </div>
  );
}

export default ResetPassword;
