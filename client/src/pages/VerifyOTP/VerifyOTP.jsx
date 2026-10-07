import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import API from "../../services/api";
import "./VerifyOTP.css";

function VerifyOTP() {
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();

    const email = location.state?.email;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email) {
            alert("Email not found. Please request OTP again.");
            navigate("/forgot-password");
            return;
        }

        if (otp.length !== 6) {
            alert("Please enter a 6-digit OTP");
            return;
        }

        try {
            setLoading(true);

            const response = await API.post(
                "/auth/verify-otp",
                {
                    email,
                    otp
                }
            );

            alert(response.data.message);

            navigate("/reset-password", {
                state: {
                    email,
                    otp
                }
            });

        } catch (error) {
            alert(
                error.response?.data?.message ||
                "Invalid or expired OTP"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="verify-otp-page">
            <div className="verify-otp-card">

                <div className="verify-otp-header">
                    <div className="brand-icon">🛍️</div>

                    <h1>C-Mart</h1>

                    <h2>Verify OTP</h2>

                    <p>
                        Enter the 6-digit OTP sent to your email.
                    </p>

                    {email && (
                        <p className="otp-email">
                            {email}
                        </p>
                    )}
                </div>

                <form onSubmit={handleSubmit}>

                    <div className="form-group">
                        <label>Enter OTP</label>

                        <input
                            type="text"
                            inputMode="numeric"
                            maxLength="6"
                            placeholder="Enter 6-digit OTP"
                            value={otp}
                            onChange={(e) =>
                                setOtp(
                                    e.target.value.replace(/\D/g, "")
                                )
                            }
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                    >
                        {loading
                            ? "Verifying..."
                            : "Verify OTP"}
                    </button>

                </form>

                <div className="back-to-login">
                    <Link to="/forgot-password">
                        ← Request OTP Again
                    </Link>
                </div>

            </div>
        </div>
    );
}

export default VerifyOTP;