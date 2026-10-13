
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Dashboard.css";

const API_URL = "http://localhost:5000/api";

function getImageUrl(product) {
  const image =
    product?.images?.[0] ||
    product?.image ||
    product?.imageUrl;

  let imageUrl = "";

  if (typeof image === "string") {
    imageUrl = image;
  } else if (image?.url) {
    imageUrl = image.url;
  } else if (image?.secure_url) {
    imageUrl = image.secure_url;
  }

  if (!imageUrl) return "";

  // Keep full URLs unchanged.
  if (
    imageUrl.startsWith("http://") ||
    imageUrl.startsWith("https://") ||
    imageUrl.startsWith("data:")
  ) {
    return imageUrl;
  }

  // Convert relative image paths to backend URLs.
  return "http://localhost:5000/" + imageUrl.replace(/^\/+/, "");
}

function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const menuItems = [
    { icon: "🏠", title: "Dashboard", path: "/" },
    { icon: "🛍️", title: "Buy Products", path: "/products" },
    { icon: "💰", title: "Sell Products", path: "/sell" },
    { icon: "🤝", title: "Seller Offers", path: "/seller-offers" },
    { icon: "🔄", title: "Swap Products", path: "/swap" },
    { icon: "🏷️", title: "Rent Products", path: "/rent" },
    { icon: "📦", title: "My Orders", path: "/orders" },
    { icon: "⚠️", title: "Complaints", path: "/complaints" },
    { icon: "👤", title: "My Profile", path: "/profile" },
  ];

  useEffect(() => {
    let active = true;

    async function fetchProducts() {
      try {
        setLoading(true);
        setError("");

        const response = await axios.get(API_URL + "/products");
        const data = response.data;

        const productList = Array.isArray(data)
          ? data
          : Array.isArray(data?.products)
          ? data.products
          : Array.isArray(data?.data)
          ? data.data
          : [];

        const sortedProducts = [...productList].sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
        );

        if (active) {
          setProducts(sortedProducts.slice(0, 8));
        }
      } catch (err) {
        console.error(
          "Dashboard products error:",
          err.response?.data || err.message
        );

        if (active) {
          setError("Unable to load products. Please try again.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchProducts();

    return () => {
      active = false;
    };
  }, [location.key]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  const openProduct = (product) => {
    const id = product._id || product.id;

    if (id) {
      navigate("/product/" + id);
    } else {
      navigate("/products");
    }
  };

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <div
          className="sidebar-brand"
          onClick={() => navigate("/")}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              navigate("/");
            }
          }}
        >
          <span className="brand-icon">🛍️</span>
          <span>C-Mart</span>
        </div>

        <div className="sidebar-label">MAIN MENU</div>

        <nav className="sidebar-navigation">
          {menuItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== "/" &&
                location.pathname.startsWith(item.path + "/"));

            return (
              <button
                key={item.path}
                type="button"
                className={"sidebar-link " + (isActive ? "active" : "")}
                onClick={() => navigate(item.path)}
              >
                <span className="sidebar-link-icon">{item.icon}</span>
                <span>{item.title}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <span>💬</span>
            <div>
              <strong>Need Help?</strong>
              <p>Contact our support team.</p>
            </div>
            <button
              type="button"
              aria-label="Open complaints"
              onClick={() => navigate("/complaints")}
            >
              →
            </button>
          </div>

          <button
            type="button"
            className="sidebar-logout"
            onClick={handleLogout}
          >
            <span>↪️</span>
            Logout
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <p className="topbar-subtitle">CAMPUS MARKETPLACE</p>
            <h2>Student Dashboard</h2>
          </div>

          <button
            type="button"
            className="topbar-profile"
            onClick={() => navigate("/profile")}
          >
            <span className="profile-avatar">👤</span>
            <span>My Profile</span>
          </button>
        </header>

        <section className="dashboard-welcome">
          <div className="welcome-content">
            <span className="welcome-badge">WELCOME TO C-MART 👋</span>

            <h1>
              Your Campus.
              <br />
              <span>Your Marketplace.</span>
            </h1>

            <p>
              Discover products listed by students in your campus.
              Buy, sell, swap and rent in one place.
            </p>

            <button
              type="button"
              className="welcome-button"
              onClick={() => navigate("/products")}
            >
              Explore Products →
            </button>
          </div>

          <div className="welcome-illustration" aria-hidden="true">
            <span className="illustration-circle">🛍️</span>
            <span className="illustration-item illustration-one">📚</span>
            <span className="illustration-item illustration-two">💻</span>
            <span className="illustration-item illustration-three">🎧</span>
          </div>
        </section>

        <section className="dashboard-products">
          <div className="dashboard-section-heading">
            <div>
              <p>FRESH ON THE MARKET</p>
              <h2>Recently Added Products</h2>
            </div>

            <button
              type="button"
              className="view-all-products"
              onClick={() => navigate("/products")}
            >
              View All →
            </button>
          </div>

          {loading ? (
            <div className="dashboard-product-message">
              Loading products...
            </div>
          ) : error ? (
            <div className="dashboard-product-message">
              <p>{error}</p>
              <button
                type="button"
                onClick={() => navigate("/products")}
              >
                Open Buy Products
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="dashboard-product-message">
              <span>🛍️</span>
              <h3>No products available yet</h3>
              <p>Products added by students will appear here.</p>
              <button
                type="button"
                onClick={() => navigate("/sell")}
              >
                Sell a Product
              </button>
            </div>
          ) : (
            <div className="dashboard-product-grid">
              {products.map((product, index) => {
                const imageUrl = getImageUrl(product);

                const productName =
                  product.name ||
                  product.productName ||
                  product.title ||
                  "Product";

                const price = product.price;
                const productId = product._id || product.id;

                return (
                  <article
                    className="dashboard-product-card"
                    key={productId || productName + "-" + index}
                  >
                    <button
                      type="button"
                      className="dashboard-product-image"
                      onClick={() => openProduct(product)}
                      aria-label={"View " + productName}
                    >
                      {imageUrl ? (
                        <img src={imageUrl} alt={productName} />
                      ) : (
                        <div className="dashboard-image-placeholder">
                          🛍️
                        </div>
                      )}
                    </button>

                    <div className="dashboard-product-info">
                      <h3 title={productName}>{productName}</h3>

                      <p className="dashboard-product-price">
                        {price !== undefined &&
                        price !== null &&
                        price !== "" &&
                        Number.isFinite(Number(price))
                          ? "₹" + Number(price).toLocaleString("en-IN")
                          : "Price not available"}
                      </p>

                      <button
                        type="button"
                        className="dashboard-product-details"
                        onClick={() => openProduct(product)}
                      >
                        View Details →
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="dashboard-support">
          <div>
            <span>⚠️</span>
            <div>
              <h3>Need assistance?</h3>
              <p>Submit a complaint if you face any issue.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/complaints")}
          >
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
