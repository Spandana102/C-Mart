
import { useNavigate } from "react-router-dom";
import "./LoginSelection.css";

function LoginSelection() {
  const navigate = useNavigate();

  return (
    <div className="login-selection-page">
      <div className="login-selection-container">
        <div className="selection-logo">🛍️</div>

        <h1>Welcome to C-MART</h1>

        <p className="selection-subtitle">
          Campus Marketplace for Students & Teachers
        </p>

        <h2>Select Your Login Type</h2>

        <div className="login-selection-cards">
          <button
            type="button"
            className="selection-card"
            onClick={() =>
              navigate("/login?role=user")
            }
          >
            <div className="selection-icon">👨‍🎓</div>

            <h3>User Login</h3>
            <p>Students & Teachers</p>
            <span>Continue as User →</span>
          </button>

          <button
            type="button"
            className="selection-card"
            onClick={() =>
              navigate("/login?role=admin")
            }
          >
            <div className="selection-icon">🛡️</div>

            <h3>Admin Login</h3>
            <p>Authorized Administrators</p>
            <span>Continue as Admin →</span>
          </button>
        </div>

        <p className="selection-footer">
          Buy • Sell • Swap • Rent • Bargain
        </p>
      </div>
    </div>
  );
}

export default LoginSelection;
