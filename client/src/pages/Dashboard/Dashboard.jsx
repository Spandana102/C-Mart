import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const features = [
    {
      icon: "🛍️",
      title: "Buy Products",
      text: "Find useful products from your campus community.",
      action: () => navigate("/products"),
    },

    {
      icon: "💰",
      title: "Sell",
      text: "List your products and connect with fellow students.",
      action: () => navigate("/sell"),
    },

    {
      icon: "🔄",
      title: "Swap",
      text: "Exchange products with other students.",
      action: () => navigate("/swap"),
    },

    {
      icon: "🏠",
      title: "Rent",
      text: "Rent items you need for a short period.",
      action: () => navigate("/rent"),
    },

    {
      icon: "📍",
      title: "Meet Point",
      text: "Choose a convenient place for your exchange.",
      action: () => navigate("/meetpoint"),
    },

    {
      icon: "📦",
      title: "My Orders",
      text: "View your purchased products and track your orders.",
      action: () => navigate("/orders"),
    },

    {
      icon: "⚠️",
      title: "Complaints",
      text: "Report an issue and let the C-Mart team review it.",
      action: () => navigate("/complaints"),
    },

    {
      icon: "👤",
      title: "My Profile",
      text: "View and manage your C-Mart account.",
      action: () => navigate("/profile"),
    },
  ];

  return (
    <div className="dashboard">

      {/* ================================
          NAVBAR
      ================================= */}

      <nav className="dashboard-navbar">

        <div
          className="logo"
          onClick={() => navigate("/")}
        >
          <span>🛍️</span>
          <span>C-Mart</span>
        </div>

        <div className="nav-links">

          <button onClick={() => navigate("/")}>
            Home
          </button>

          <button onClick={() => navigate("/orders")}>
            Orders
          </button>

          <button onClick={() => navigate("/complaints")}>
            Complaints
          </button>

          <button onClick={() => navigate("/profile")}>
            Profile
          </button>

          <button
            className="logout-btn"
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              navigate("/login");
            }}
          >
            Logout
          </button>

        </div>
      </nav>


      {/* ================================
          HERO SECTION
      ================================= */}

      <section className="hero-section">

        <div className="hero-content">

          <p className="welcome-text">
            WELCOME TO C-MART 👋
          </p>

          <h1>
            Your Campus.
            <br />
            <span>Your Marketplace.</span>
          </h1>

          <p className="hero-description">
            Buy, sell, swap and rent products within your campus
            community — all in one place.
          </p>

          <div className="hero-buttons">

            <button
              className="primary-btn"
              onClick={() => navigate("/products")}
            >
              Explore Marketplace →
            </button>

            <button
              className="secondary-btn"
              onClick={() => navigate("/profile")}
            >
              My Profile
            </button>

          </div>

        </div>


        {/* HERO VISUAL */}

        <div className="hero-visual">

          <div className="floating-card card-one">
            🛒
            <span>Buy & Sell</span>
          </div>

          <div className="floating-card card-two">
            🔄
            <span>Swap Easily</span>
          </div>

          <div className="floating-card card-three">
            🏠
            <span>Rent Smart</span>
          </div>

          <div className="main-shopping-icon">
            🛍️
          </div>

        </div>

      </section>


      {/* ================================
          FEATURES
      ================================= */}

      <section className="features-section">

        <div className="section-heading">

          <p>EXPLORE C-MART</p>

          <h2>Everything You Need</h2>

          <span>
            Simple tools designed for your campus community.
          </span>

        </div>


        <div className="feature-grid">

          {features.map((feature, index) => (

            <div
              className="feature-card"
              key={index}
            >

              <div className="feature-icon">
                {feature.icon}
              </div>

              <h3>
                {feature.title}
              </h3>

              <p>
                {feature.text}
              </p>

              <button onClick={feature.action}>
                Explore →
              </button>

            </div>

          ))}

        </div>

      </section>


      {/* ================================
          COMPLAINT SUPPORT BANNER
      ================================= */}

      <section className="bottom-banner">

        <div>

          <p>
            NEED HELP?
          </p>

          <h2>
            Have an issue? Let us know.
          </h2>

        </div>

        <button
          onClick={() => navigate("/complaints")}
        >
          Submit Complaint →
        </button>

      </section>


      {/* ================================
          FOOTER
      ================================= */}

      <footer>

        <div className="footer-logo">
          🛍️ C-Mart
        </div>

        <p>
          Campus Marketplace • Buy • Sell • Swap • Rent
        </p>

      </footer>

    </div>
  );
}

export default Dashboard;