import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../services/api";
import "./ForgotPassword.css";

function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        const cleanEmail = email.trim();

        try {
            setLoading(true);

            const response = await API.post(
                "/auth/forgot-password",
                {
                    email: cleanEmail
                }
            );

            alert(response.data.message);

            navigate("/verify-otp", {
                state: {
                    email: cleanEmail
                }
            });

        } catch (error) {
            alert(
                error.response?.data?.message ||
                "Unable to send OTP"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="forgot-password-page">

            <div className="forgot-password-card">

                <div className="forgot-password-header">

                    <div className="brand-icon">🛍️</div>

                    <h1>C-Mart</h1>

                    <h2>Forgot Password?</h2>

                    <p>
                        Enter your registered email to receive
                        an OTP
                    </p>

                </div>

                <form onSubmit={handleSubmit}>

                    <div className="form-group">

                        <label>Email Address</label>

                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) =>
                                setEmail(e.target.value)
                            }
                            style={{
                                letterSpacing: "normal",
                                wordSpacing: "normal"
                            }}
                            required
                        />

                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                    >
                        {loading
                            ? "Sending OTP..."
                            : "Send OTP"}
                    </button>

                </form>

                <div className="back-to-login">

                    <Link to="/login">
                        ← Back to Login
                    </Link>

                </div>

            </div>

        </div>
    );
}

export default ForgotPassword;