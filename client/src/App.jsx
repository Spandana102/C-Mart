import { BrowserRouter, Routes, Route } from "react-router-dom";
import BargainPage from "./pages/BargainPage";
import SellerOffers from "./pages/SellerOffers";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ================= HOME PAGE ================= */}
        <Route
          path="/"
          element={
            <div style={styles.page}>

              {/* Navbar */}
              <nav style={styles.navbar}>

                <div style={styles.logo}>
                  🛒 <span>C-Mart</span>
                </div>

                <div style={styles.navLinks}>

                  <a
                    href="/"
                    style={styles.navLink}
                  >
                    Home
                  </a>

                  <a
                    href="/bargain"
                    style={styles.navLink}
                  >
                    Buy
                  </a>

                  <a
                    href="#"
                    style={styles.navLink}
                  >
                    Sell
                  </a>

                  <a
                    href="/seller-offers"
                    style={styles.navLink}
                  >
                    My Orders
                  </a>

                </div>

                <button style={styles.loginButton}>
                  Login
                </button>

              </nav>


              {/* ================= HERO SECTION ================= */}

              <section style={styles.hero}>

                <div style={styles.heroText}>

                  <p style={styles.smallTitle}>
                    🎓 CAMPUS MARKETPLACE
                  </p>

                  <h1 style={styles.heading}>
                    Buy. Sell.{" "}
                    <span style={styles.highlight}>
                      Save.
                    </span>
                  </h1>

                  <p style={styles.description}>
                    Your campus marketplace for books, gadgets,
                    calculators, cycles, hostel essentials and more.
                  </p>

                  <div style={styles.buttons}>

                    <a
                      href="/bargain"
                      style={styles.primaryButton}
                    >
                      🛍️ Start Shopping
                    </a>

                    <button style={styles.secondaryButton}>
                      + Sell an Item
                    </button>

                  </div>

                </div>


                {/* Hero Card */}

                <div style={styles.heroCard}>

                  <div style={styles.cardEmoji}>
                    🛒
                  </div>

                  <h2>
                    Campus Bazar
                  </h2>

                  <p>
                    Everything students need, in one place.
                  </p>

                  <div style={styles.miniItems}>

                    <div>
                      📚 Books
                    </div>

                    <div>
                      💻 Gadgets
                    </div>

                    <div>
                      🧮 Calculators
                    </div>

                    <div>
                      🚲 Cycles
                    </div>

                  </div>

                </div>

              </section>


              {/* ================= CATEGORIES ================= */}

              <section style={styles.section}>

                <h2 style={styles.sectionTitle}>
                  Explore Categories
                </h2>

                <p style={styles.sectionSubtitle}>
                  Find what you need around your campus
                </p>

                <div style={styles.categories}>

                  <Category
                    emoji="📚"
                    title="Books"
                  />

                  <Category
                    emoji="🧮"
                    title="Calculators"
                  />

                  <Category
                    emoji="💻"
                    title="Electronics"
                  />

                  <Category
                    emoji="🚲"
                    title="Cycles"
                  />

                  <Category
                    emoji="🎒"
                    title="Hostel Items"
                  />

                  <Category
                    emoji="📱"
                    title="Accessories"
                  />

                </div>

              </section>


              {/* ================= FEATURES ================= */}

              <section style={styles.featuresSection}>

                <h2 style={styles.sectionTitle}>
                  Why Students Choose C-Mart
                </h2>

                <div style={styles.features}>

                  <Feature
                    emoji="💰"
                    title="Better Prices"
                    text="Buy and sell products at student-friendly prices."
                  />

                  <Feature
                    emoji="🤝"
                    title="Easy Bargaining"
                    text="Make an offer and negotiate directly with sellers."
                  />

                  <Feature
                    emoji="🔒"
                    title="Safer Transactions"
                    text="Payment verification helps keep transactions organized."
                  />

                  <Feature
                    emoji="⚡"
                    title="Quick & Simple"
                    text="Find products around your campus without the hassle."
                  />

                </div>

              </section>


              {/* ================= FOOTER ================= */}

              <footer style={styles.footer}>

                <h2>
                  🛒 C-Mart
                </h2>

                <p>
                  Campus Bazar — Buy • Sell • Save
                </p>

                <p style={styles.footerSmall}>
                  © 2026 C-Mart. College Project.
                </p>

              </footer>

            </div>
          }
        />


        {/* ================= BARGAIN PAGE ================= */}

        <Route
          path="/bargain"
          element={<BargainPage />}
        />


        {/* ================= SELLER OFFERS ================= */}

        <Route
          path="/seller-offers"
          element={<SellerOffers />}
        />

      </Routes>
    </BrowserRouter>
  );
}


/* =====================================================
   CATEGORY COMPONENT
===================================================== */

function Category({ emoji, title }) {

  return (
    <div style={styles.category}>

      <div style={styles.categoryEmoji}>
        {emoji}
      </div>

      <h3>
        {title}
      </h3>

      <p>
        Explore →
      </p>

    </div>
  );
}


/* =====================================================
   FEATURE COMPONENT
===================================================== */

function Feature({ emoji, title, text }) {

  return (
    <div style={styles.feature}>

      <div style={styles.featureEmoji}>
        {emoji}
      </div>

      <h3>
        {title}
      </h3>

      <p>
        {text}
      </p>

    </div>
  );
}


/* =====================================================
   STYLES
===================================================== */

const styles = {

  page: {
    minHeight: "100vh",
    background: "#f6f8fc",
    color: "#172033",
    fontFamily: "Arial, sans-serif",
  },


  /* Navbar */

  navbar: {
    height: "70px",
    background: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 7%",
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },


  logo: {
    fontSize: "25px",
    fontWeight: "800",
  },


  navLinks: {
    display: "flex",
    gap: "35px",
  },


  navLink: {
    textDecoration: "none",
    color: "#4b5563",
    fontWeight: "600",
  },


  loginButton: {
    border: "none",
    background: "#2563eb",
    color: "white",
    padding: "11px 23px",
    borderRadius: "10px",
    fontWeight: "700",
    cursor: "pointer",
  },


  /* Hero */

  hero: {
    minHeight: "520px",
    padding: "70px 8%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "50px",
    background:
      "linear-gradient(135deg, #eef5ff 0%, #ffffff 55%, #eefbf7 100%)",
  },


  heroText: {
    maxWidth: "620px",
  },


  smallTitle: {
    color: "#2563eb",
    fontWeight: "800",
    letterSpacing: "2px",
    fontSize: "14px",
  },


  heading: {
    fontSize: "64px",
    lineHeight: "1.05",
    margin: "15px 0",
  },


  highlight: {
    color: "#2563eb",
  },


  description: {
    fontSize: "19px",
    lineHeight: "1.7",
    color: "#64748b",
    maxWidth: "580px",
  },


  buttons: {
    display: "flex",
    gap: "15px",
    marginTop: "30px",
  },


  primaryButton: {
    border: "none",
    background: "#2563eb",
    color: "white",
    padding: "15px 25px",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-block",
  },


  secondaryButton: {
    background: "white",
    color: "#2563eb",
    border: "2px solid #2563eb",
    padding: "13px 25px",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
  },


  /* Hero Card */

  heroCard: {
    width: "350px",
    minHeight: "350px",
    background: "#ffffff",
    borderRadius: "25px",
    padding: "35px",
    boxShadow: "0 20px 50px rgba(37,99,235,0.15)",
    textAlign: "center",
  },


  cardEmoji: {
    fontSize: "75px",
    marginBottom: "10px",
  },


  miniItems: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginTop: "25px",
  },


  /* Categories */

  section: {
    padding: "75px 8%",
    textAlign: "center",
    background: "#ffffff",
  },


  sectionTitle: {
    fontSize: "32px",
    marginBottom: "8px",
  },


  sectionSubtitle: {
    color: "#64748b",
    marginBottom: "40px",
  },


  categories: {
    display: "grid",
    gridTemplateColumns: "repeat(6, 1fr)",
    gap: "18px",
  },


  category: {
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "25px 10px",
    cursor: "pointer",
  },


  categoryEmoji: {
    fontSize: "40px",
  },


  /* Features */

  featureEmoji: {
    fontSize: "42px",
  },


  featuresSection: {
    padding: "75px 8%",
    background: "#f6f8fc",
    textAlign: "center",
  },


  features: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "22px",
    marginTop: "40px",
  },


  feature: {
    background: "white",
    padding: "30px",
    borderRadius: "18px",
    boxShadow: "0 8px 25px rgba(0,0,0,0.05)",
  },


  /* Footer */

  footer: {
    background: "#111827",
    color: "white",
    textAlign: "center",
    padding: "45px 20px",
  },


  footerSmall: {
    color: "#9ca3af",
    fontSize: "13px",
    marginTop: "20px",
  },

};


export default App;