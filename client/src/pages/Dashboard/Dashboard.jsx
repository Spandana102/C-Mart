import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const features = [
    {
      icon: "🛍️",
      title: "Buy Products",
      text: "Find books, gadgets, calculators and useful campus products.",
      route: "/products",
      className: "purple",
    },
    {
      icon: "💰",
      title: "Sell Products",
      text: "List your unused products and connect with students.",
      route: "/products",
      className: "blue",
    },
    {
      icon: "🔄",
      title: "Swap Items",
      text: "Exchange products with other students easily.",
      route: "/swap",
      className: "green",
    },
    {
      icon: "🏠",
      title: "Rent",
      text: "Rent useful products for short-term campus needs.",
      route: "/rent",
      className: "orange",
    },
    {
      icon: "🤝",
      title: "Bargaining",
      text: "Make offers and negotiate a better price with sellers.",
      route: "/bargain",
      className: "pink",
    },
    {
      icon: "⭐",
      title: "Reviews",
      text: "Check ratings and share your experience with other students.",
      route: "/reviews",
      className: "yellow",
    },
  ];

  return (
    <div className="dashboard">

      {/* ================= NAVBAR ================= */}

      <nav className="cm-navbar">

        <div
          className="cm-brand"
          onClick={() => navigate("/")}
        >
          <div className="cm-logo">🛍️</div>

          <div>
            <h2>C-Mart</h2>
            <span>Campus Marketplace</span>
          </div>
        </div>

        <div className="cm-nav-links">
          <button
            className="active"
            onClick={() => navigate("/")}
          >
            Home
          </button>

          <button onClick={() => navigate("/products")}>
            Marketplace
          </button>

          <button onClick={() => navigate("/swap")}>
            Swap
          </button>

          <button onClick={() => navigate("/rent")}>
            Rent
          </button>

          <button onClick={() => navigate("/orders")}>
            Orders
          </button>
        </div>

        <div className="cm-nav-right">

          <button
            className="profile-btn"
            onClick={() => navigate("/profile")}
          >
            <span>A</span>
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


      {/* ================= HERO ================= */}

      <section className="cm-hero">

        <div className="hero-content">

          <div className="welcome-label">
            <span></span>
            YOUR CAMPUS MARKETPLACE
          </div>

          <h1>
            Everything your
            <br />
            campus needs,
            <br />
            <strong>in one place.</strong>
          </h1>

          <p>
            Buy, sell, swap, rent and bargain with students
            around your campus. C-Mart makes student-to-student
            shopping simple, affordable and convenient.
          </p>

          <div className="hero-actions">

            <button
              className="main-btn"
              onClick={() => navigate("/products")}
            >
              Explore Marketplace
              <span>→</span>
            </button>

            <button
              className="second-btn"
              onClick={() => navigate("/products")}
            >
              + Sell Something
            </button>

          </div>

          <div className="hero-info">

            <div className="mini-users">
              <span>👨🏻</span>
              <span>👩🏻</span>
              <span>👨🏽</span>
              <span>+</span>
            </div>

            <div>
              <strong>Built for students</strong>
              <small>Buy • Sell • Swap • Rent</small>
            </div>

          </div>

        </div>


        {/* ================= MARKETPLACE PREVIEW ================= */}

        <div className="market-area">

          <div className="purple-circle"></div>

          <div className="market-card">

            <div className="market-top">

              <div>
                <small>DISCOVER</small>
                <h3>Campus Marketplace</h3>
              </div>

              <button>•••</button>

            </div>


            <div className="fake-search">

              <span>⌕</span>

              <p>Search products...</p>

              <b>⌘ K</b>

            </div>


            <div className="categories">

              <span className="selected">All</span>
              <span>Books</span>
              <span>Gadgets</span>
              <span>Others</span>

            </div>


            <div className="mock-products">

              <div className="mock-product">

                <div className="mock-image book">
                  📚
                </div>

                <div className="mock-details">

                  <strong>
                    Engineering Books
                  </strong>

                  <small>
                    Good condition
                  </small>

                  <b>
                    ₹450
                  </b>

                </div>

              </div>


              <div className="mock-product">

                <div className="mock-image calculator">
                  🧮
                </div>

                <div className="mock-details">

                  <strong>
                    Scientific Calculator
                  </strong>

                  <small>
                    Like new
                  </small>

                  <b>
                    ₹700
                  </b>

                </div>

              </div>

            </div>


            <button
              className="market-btn"
              onClick={() => navigate("/products")}
            >
              View Marketplace →
            </button>

          </div>


          {/* FLOATING CARD */}

          <div className="floating floating-left">

            <div className="floating-icon success">
              ✓
            </div>

            <div>
              <strong>Easy Exchange</strong>
              <small>Meet Point available</small>
            </div>

          </div>


          {/* FLOATING CARD */}

          <div className="floating floating-right">

            <div className="floating-icon chat">
              💬
            </div>

            <div>
              <strong>Easy Bargaining</strong>
              <small>Make your offer</small>
            </div>

          </div>

        </div>

      </section>


      {/* ================= QUICK SERVICES ================= */}

      <section className="quick-section">

        <div
          className="quick-item"
          onClick={() => navigate("/products")}
        >
          <div className="quick-icon purple">
            🛍️
          </div>

          <div>
            <strong>Buy & Sell</strong>
            <span>Campus Products</span>
          </div>
        </div>


        <div
          className="quick-item"
          onClick={() => navigate("/swap")}
        >
          <div className="quick-icon blue">
            🔄
          </div>

          <div>
            <strong>Swap Easily</strong>
            <span>Exchange Items</span>
          </div>
        </div>


        <div
          className="quick-item"
          onClick={() => navigate("/rent")}
        >
          <div className="quick-icon green">
            🏠
          </div>

          <div>
            <strong>Rent Smart</strong>
            <span>Save More Money</span>
          </div>
        </div>


        <div
          className="quick-item"
          onClick={() => navigate("/bargain")}
        >
          <div className="quick-icon orange">
            🤝
          </div>

          <div>
            <strong>Bargain</strong>
            <span>Best Prices</span>
          </div>
        </div>

      </section>


      {/* ================= FEATURES ================= */}

      <section className="features-section">

        <div className="section-heading">

          <div>

            <span>EXPLORE C-MART</span>

            <h2>
              Everything you need
              <br />
              <strong>for campus life.</strong>
            </h2>

          </div>

          <p>
            One marketplace for everything students
            buy, sell, exchange and rent.
          </p>

        </div>


        <div className="feature-grid">

          {features.map((feature, index) => (

            <div
              className={`feature-box ${feature.className}`}
              key={feature.title}
              onClick={() => navigate(feature.route)}
            >

              <div className="feature-header">

                <div className="feature-icon">
                  {feature.icon}
                </div>

                <span className="number">
                  0{index + 1}
                </span>

              </div>


              <h3>
                {feature.title}
              </h3>


              <p>
                {feature.text}
              </p>


              <div className="feature-action">
                Explore
                <span>→</span>
              </div>

            </div>

          ))}

        </div>

      </section>


      {/* ================= HOW IT WORKS ================= */}

      <section className="how-section">

        <div className="how-title">

          <span>HOW C-MART WORKS</span>

          <h2>
            Simple. <strong>Fast.</strong>
            <br />
            <strong>Student-friendly.</strong>
          </h2>

        </div>


        <div className="steps">

          <div className="step">

            <div className="step-number">
              01
            </div>

            <div className="step-icon">
              🔎
            </div>

            <h3>Find</h3>

            <p>
              Search and discover products
              available around your campus.
            </p>

          </div>


          <div className="line"></div>


          <div className="step">

            <div className="step-number">
              02
            </div>

            <div className="step-icon">
              💬
            </div>

            <h3>Connect</h3>

            <p>
              Chat with sellers, bargain and
              agree on the right price.
            </p>

          </div>


          <div className="line"></div>


          <div className="step">

            <div className="step-number">
              03
            </div>

            <div className="step-icon">
              🤝
            </div>

            <h3>Exchange</h3>

            <p>
              Meet at a convenient point and
              complete your transaction.
            </p>

          </div>

        </div>

      </section>


      {/* ================= ORDERS ================= */}

      <section className="orders-section">

        <div className="orders-icon">
          📦
        </div>

        <div className="orders-text">

          <span>YOUR ACTIVITY</span>

          <h2>
            Keep track of your orders.
          </h2>

          <p>
            View your purchases, payment status
            and order history in one place.
          </p>

        </div>

        <button
          onClick={() => navigate("/orders")}
        >
          View My Orders →
        </button>

      </section>


      {/* ================= FINAL CTA ================= */}

      <section className="final-section">

        <div className="final-content">

          <span>
            WELCOME TO THE COMMUNITY
          </span>

          <h2>
            Your campus.
            <br />
            <strong>Your marketplace.</strong>
          </h2>

          <p>
            Start discovering what your campus
            has to offer.
          </p>

          <button
            onClick={() => navigate("/products")}
          >
            Explore C-Mart ↗
          </button>

        </div>

        <div className="big-bag">
          🛍️
        </div>

      </section>


      {/* ================= FOOTER ================= */}

      <footer className="cm-footer">

        <div className="footer-brand">

          <div className="footer-logo">
            🛍️
          </div>

          <div>
            <strong>C-Mart</strong>
            <span>Campus Marketplace</span>
          </div>

        </div>


        <p>
          Buy • Sell • Swap • Rent • Bargain • Reviews
        </p>


        <button
          onClick={() => navigate("/profile")}
        >
          My Profile →
        </button>

      </footer>

    </div>
  );
}

export default Dashboard;