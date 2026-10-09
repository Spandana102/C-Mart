
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const menuItems = [
    { icon: "🏠", title: "Dashboard", path: "/" },
    { icon: "🛍️", title: "Buy Products", path: "/products" },
    { icon: "💰", title: "Sell Products", path: "/sell" },
    { icon: "🔄", title: "Swap Products", path: "/swap" },
    { icon: "🏷️", title: "Rent Products", path: "/rent" },
    { icon: "🤝", title: "Bargaining", path: "/bargain" },
    { icon: "📍", title: "Meet Point", path: "/meetpoint" },
    { icon: "📦", title: "My Orders", path: "/orders" },
    { icon: "⭐", title: "Reviews & Ratings", path: "/reviews" },
    { icon: "⚠️", title: "Complaints", path: "/complaints" },
    { icon: "👤", title: "My Profile", path: "/profile" },
  ];

  const featureCards = [
    {
      icon: "🛍️",
      title: "Buy Products",
      description: "Explore products available in your campus.",
      path: "/products",
      color: "blue",
    },
    {
      icon: "💰",
      title: "Sell Products",
      description: "List your products for other students.",
      path: "/sell",
      color: "green",
    },
    {
      icon: "🔄",
      title: "Swap Products",
      description: "Exchange your items with other students.",
      path: "/swap",
      color: "purple",
    },
    {
      icon: "🏠",
      title: "Rent Products",
      description: "Find items to rent for a limited period.",
      path: "/rent",
      color: "orange",
    },
    {
      icon: "🤝",
      title: "Bargaining",
      description: "Make offers and negotiate product prices.",
      path: "/bargain",
      color: "pink",
    },
    {
      icon: "📍",
      title: "Meet Point",
      description: "Choose a convenient exchange location.",
      path: "/meetpoint",
      color: "cyan",
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  return (
    <div className="dashboard-layout">
      {/* LEFT SIDEBAR */}
      <aside className="dashboard-sidebar">
        <div
          className="sidebar-brand"
          onClick={() => navigate("/")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              navigate("/");
            }
          }}
        >
          <span className="brand-icon">🛍️</span>
          <span>C-Mart</span>
        </div>

        <div className="sidebar-label">MAIN MENU</div>

        <nav className="sidebar-navigation">
          {menuItems.map((item) => (
            <button
              key={item.path}
              className={`sidebar-link ${
                item.path === "/" ? "active" : ""
              }`}
              onClick={() => navigate(item.path)}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              <span>{item.title}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <span>💬</span>
            <div>
              <strong>Need Help?</strong>
              <p>Contact our support team.</p>
            </div>
            <button
              aria-label="Open complaints"
              onClick={() => navigate("/complaints")}
            >
              →
            </button>
          </div>

          <button className="sidebar-logout" onClick={handleLogout}>
            <span>↪️</span>
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <p className="topbar-subtitle">CAMPUS MARKETPLACE</p>
            <h2>Student Dashboard</h2>
          </div>

          <button
            className="topbar-profile"
            onClick={() => navigate("/profile")}
          >
            <span className="profile-avatar">👤</span>
            <span>My Profile</span>
          </button>
        </header>

        {/* WELCOME BANNER */}
        <section className="dashboard-welcome">
          <div className="welcome-content">
            <span className="welcome-badge">WELCOME TO C-MART 👋</span>

            <h1>
              Your Campus.
              <br />
              <span>Your Marketplace.</span>
            </h1>

            <p>
              Buy, sell, swap, rent and negotiate products with
              students in your campus community.
            </p>

            <button
              className="welcome-button"
              onClick={() => navigate("/products")}
            >
              Explore Products <span>→</span>
            </button>
          </div>

          <div className="welcome-illustration" aria-hidden="true">
            <span className="illustration-circle">🛍️</span>
            <span className="illustration-item illustration-one">📚</span>
            <span className="illustration-item illustration-two">💻</span>
            <span className="illustration-item illustration-three">🎧</span>
          </div>
        </section>

        {/* QUICK ACCESS */}
        <section className="dashboard-features">
          <div className="dashboard-section-heading">
            <div>
              <p>EXPLORE C-MART</p>
              <h2>Marketplace Services</h2>
            </div>

            <span>Choose a service to get started</span>
          </div>

          <div className="dashboard-feature-grid">
            {featureCards.map((feature) => (
              <button
                className="dashboard-feature-card"
                key={feature.title}
                onClick={() => navigate(feature.path)}
              >
                <span
                  className={`feature-card-icon ${feature.color}`}
                >
                  {feature.icon}
                </span>

                <span className="feature-card-title">
                  {feature.title}
                </span>

                <span className="feature-card-description">
                  {feature.description}
                </span>

                <span className="feature-card-action">
                  Open Service →
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* BOTTOM SUPPORT */}
        <section className="dashboard-support">
          <div>
            <span>⚠️</span>
            <div>
              <h3>Need assistance?</h3>
              <p>Submit a complaint if you face any issue.</p>
            </div>
          </div>

          <button onClick={() => navigate("/complaints")}>
            Submit Complaint →
          </button>
        </section>

        <footer className="dashboard-footer">
          © 2026 C-Mart · Campus Marketplace for Students
        </footer>
      </main>
    </div>
  );
}

export default Dashboard;