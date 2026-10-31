
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Dashboard.css";

const API_URL = "http://localhost:5000/api";
const SERVER_URL = "http://localhost:5000";

const DASHBOARD_PATH = "/dashboard";

// ==========================================
// IMAGE HELPER
// ==========================================

function normalizeImage(image) {
  if (!image) return "";

  if (Array.isArray(image)) {
    return image.map(normalizeImage).find(Boolean) || "";
  }

  if (typeof image === "object") {
    return normalizeImage(
      image.secure_url ||
        image.url ||
        image.imageUrl ||
        image.path ||
        image.src
    );
  }

  if (typeof image !== "string") return "";

  const value = image.trim().replace(/\\/g, "/");

  if (!value) return "";

  if (
    /^https?:\/\//i.test(value) ||
    value.startsWith("data:") ||
    value.startsWith("blob:")
  ) {
    return value;
  }

  if (value.startsWith("//")) {
    return `https:${value}`;
  }

  return `${SERVER_URL}/${value.replace(/^\/+/, "")}`;
}

function getImageUrl(product) {
  return normalizeImage(
    product?.images ||
      product?.image ||
      product?.imageUrl ||
      product?.productImage
  );
}

// ==========================================
// DASHBOARD COMPONENT
// ==========================================

function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [wishlistCount, setWishlistCount] = useState(null);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);

  // ========================================
  // AUTHENTICATED NAVIGATION
  // ========================================

  const navigateTo = (path) => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    navigate(path);
  };

  const goToDashboard = () => {
    navigateTo(DASHBOARD_PATH);
  };

  const openNotifications = () => {
    navigateTo("/notifications");
  };

  const openWishlist = () => {
    navigateTo("/wishlist");
  };

  const openMyProducts = () => {
    navigateTo("/my-products");
  };

  // ========================================
  // SIDEBAR MENU
  // ========================================

  const menuItems = [
    {
      icon: "🏠",
      title: "Dashboard",
      path: DASHBOARD_PATH,
    },
    {
      icon: "🛍️",
      title: "Buy Products",
      path: "/products",
    },
    {
      icon: "💰",
      title: "Sell Products",
      path: "/sell",
    },
    {
      icon: "📦",
      title: "My Products",
      path: "/my-products",
    },
    {
      icon: "❤️",
      title: "My Wishlist",
      path: "/wishlist",
    },
    {
      icon: "🤝",
      title: "Seller Offers",
      path: "/seller-offers",
    },
    {
      icon: "🔄",
      title: "Swap Products",
      path: "/swap",
    },
    {
      icon: "🏷️",
      title: "Rent Products",
      path: "/rent",
    },
    {
      icon: "🧾",
      title: "My Orders",
      path: "/orders",
    },
    {
      icon: "⚠️",
      title: "Complaints",
      path: "/complaints",
    },
    {
      icon: "💬",
      title: "My Chats",
      path: "/chat",
    },
    {
      icon: "🔔",
      title: "Notifications",
      path: "/notifications",
    },
    {
      icon: "👤",
      title: "My Profile",
      path: "/profile",
    },
  ];

  const handleMenuClick = (path) => {
    if (path === "/wishlist") {
      openWishlist();
    } else if (path === "/notifications") {
      openNotifications();
    } else if (path === "/my-products") {
      openMyProducts();
    } else {
      navigateTo(path);
    }
  };

  // ========================================
  // FETCH PRODUCTS
  // ========================================

  useEffect(() => {
    let active = true;

    async function fetchProducts() {
      try {
        setLoading(true);
        setError("");

        const response = await axios.get(
          `${API_URL}/products`
        );

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
          setProducts(sortedProducts);
        }
      } catch (err) {
        console.error(
          "Dashboard Products Error:",
          err.response?.data || err.message
        );

        if (active) {
          setError(
            "Unable to load products. Please try again."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchProducts();

    return () => {
      active = false;
    };
  }, [location.key]);

  // ========================================
  // FETCH WISHLIST COUNT
  // ========================================

  useEffect(() => {
    let active = true;

    async function fetchWishlistCount() {
      const token = localStorage.getItem("token");

      if (!token) {
        if (active) setWishlistCount(null);
        return;
      }

      try {
        const response = await axios.get(
          `${API_URL}/wishlist`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const savedProducts = Array.isArray(
          response.data?.wishlist
        )
          ? response.data.wishlist
          : [];

        if (active) {
          setWishlistCount(savedProducts.length);
        }
      } catch (err) {
        console.error(
          "Dashboard Wishlist Error:",
          err.response?.data || err.message
        );

        if (active) setWishlistCount(null);
      }
    }

    fetchWishlistCount();

    return () => {
      active = false;
    };
  }, [location.key]);

  // ========================================
  // FETCH UNREAD CHAT COUNT
  // ========================================

  useEffect(() => {
    let active = true;

    const fetchUnread = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        if (active) setUnreadChatCount(0);
        return;
      }

      try {
        const { data } = await axios.get(
          `${API_URL}/chat/unread-count`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (active) {
          setUnreadChatCount(
            Number(data?.unreadCount) || 0
          );
        }
      } catch (err) {
        console.error(
          "Dashboard unread chat count:",
          err.response?.data || err.message
        );
      }
    };

    fetchUnread();

    const timer = setInterval(fetchUnread, 3000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [location.key]);

  // ========================================
  // FETCH NOTIFICATION COUNT
  // ========================================

  useEffect(() => {
    let active = true;

    const fetchNotificationCount = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        if (active) setNotificationCount(0);
        return;
      }

      try {
        const response = await axios.get(
          `${API_URL}/notifications`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (active) {
          setNotificationCount(
            Number(response.data?.unreadCount) || 0
          );
        }
      } catch (err) {
        console.error(
          "Dashboard Notifications Error:",
          err.response?.data || err.message
        );
      }
    };

    fetchNotificationCount();

    const timer = setInterval(
      fetchNotificationCount,
      5000
    );

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [location.key]);

  // ========================================
  // LOGOUT
  // ========================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login", {
      replace: true,
    });
  };

  // ========================================
  // OPEN PRODUCT DETAILS
  // ========================================

  const openProduct = (product) => {
    const id = product?._id || product?.id;

    if (id) {
      navigateTo(`/product/${id}`);
    } else {
      navigateTo("/products");
    }
  };

  // ========================================
  // DASHBOARD UI
  // ========================================

  return (
    <div className="dashboard-layout">
      {/* LEFT SIDEBAR */}

      <aside className="dashboard-sidebar">
        <div
          className="sidebar-brand"
          onClick={goToDashboard}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" ||
              event.key === " "
            ) {
              event.preventDefault();
              goToDashboard();
            }
          }}
        >
          <span className="brand-icon">
            🛍️
          </span>

          <span>C-Mart</span>
        </div>

        <div className="sidebar-label">
          MAIN MENU
        </div>

        <nav className="sidebar-navigation">
          {menuItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              location.pathname.startsWith(
                item.path + "/"
              );

            return (
              <button
                key={item.path}
                type="button"
                className={
                  "sidebar-link " +
                  (isActive ? "active" : "")
                }
                onClick={() =>
                  handleMenuClick(item.path)
                }
              >
                <span className="sidebar-link-icon">
                  {item.icon}
                </span>

                <span>{item.title}</span>

                {/* CHAT UNREAD BADGE */}

                {item.path === "/chat" &&
                  unreadChatCount > 0 && (
                    <span
                      className="cm-unread-badge"
                      aria-label={`${unreadChatCount} unread messages`}
                    >
                      {unreadChatCount > 99
                        ? "99+"
                        : unreadChatCount}
                    </span>
                  )}

                {/* NOTIFICATION BADGE */}

                {item.path === "/notifications" &&
                  notificationCount > 0 && (
                    <span
                      className="cm-unread-badge"
                      aria-label={`${notificationCount} unread notifications`}
                    >
                      {notificationCount > 99
                        ? "99+"
                        : notificationCount}
                    </span>
                  )}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <span>💬</span>

            <div>
              <strong>Need Help?</strong>
              <p>
                Contact our support team.
              </p>
            </div>

            <button
              type="button"
              aria-label="Open complaints"
              onClick={() =>
                navigateTo("/complaints")
              }
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

      {/* RIGHT CONTENT */}

      <main className="dashboard-main">
        {/* TOPBAR */}

        <header className="dashboard-topbar">
          <div>
            <p className="topbar-subtitle">
              CAMPUS MARKETPLACE
            </p>

            <h2>Student Dashboard</h2>
          </div>

          <div className="dashboard-topbar-actions">
            {/* NOTIFICATIONS BELL */}

            <button
              type="button"
              className="dashboard-notification-btn"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                openNotifications();
              }}
              title="Open Notifications"
              aria-label={`Open Notifications, ${notificationCount} unread`}
              style={{
                position: "relative",
                zIndex: 20,
                cursor: "pointer",
                pointerEvents: "auto",
                flexShrink: 0,
              }}
            >
              <span
                className="dashboard-notification-icon"
                style={{
                  pointerEvents: "none",
                }}
              >
                🔔
              </span>

              {notificationCount > 0 && (
                <span
                  className="dashboard-notification-badge"
                  style={{
                    pointerEvents: "none",
                  }}
                >
                  {notificationCount > 99
                    ? "99+"
                    : notificationCount}
                </span>
              )}
            </button>

            {/* WISHLIST */}

            <button
              type="button"
              className="topbar-wishlist"
              onClick={openWishlist}
              title="Open My Wishlist"
            >
              <span>❤️</span>

              <span>
                My Wishlist
                {wishlistCount !== null
                  ? ` (${wishlistCount})`
                  : ""}
              </span>
            </button>

            {/* PROFILE */}

            <button
              type="button"
              className="topbar-profile"
              onClick={() =>
                navigateTo("/profile")
              }
            >
              <span className="profile-avatar">
                👤
              </span>

              <span>My Profile</span>
            </button>
          </div>
        </header>

        {/* WELCOME BANNER */}

        <section className="dashboard-welcome">
          <div className="welcome-content">
            <span className="welcome-badge">
              WELCOME TO C-MART 👋
            </span>

            <h1>
              Your Campus.
              <br />
              <span>Your Marketplace.</span>
            </h1>

            <p>
              Discover products uploaded by students
              in your campus. Explore products,
              compare prices and find what you need.
            </p>

            <button
              type="button"
              className="welcome-button"
              onClick={() =>
                navigateTo("/products")
              }
            >
              Explore Products →
            </button>
          </div>

          <div
            className="welcome-illustration"
            aria-hidden="true"
          >
            <span className="illustration-circle">
              🛍️
            </span>

            <span className="illustration-item illustration-one">
              📚
            </span>

            <span className="illustration-item illustration-two">
              💻
            </span>

            <span className="illustration-item illustration-three">
              🎧
            </span>
          </div>
        </section>

        {/* WISHLIST QUICK ACCESS */}

        <section className="dashboard-wishlist-section">
          <div className="dashboard-wishlist-content">
            <div className="dashboard-wishlist-icon">
              ❤️
            </div>

            <div className="dashboard-wishlist-text">
              <h3>My Wishlist</h3>

              <p>
                Save your favourite products and
                view them anytime.
              </p>

              {wishlistCount !== null && (
                <p>
                  {wishlistCount === 0
                    ? "No saved products yet."
                    : `${wishlistCount} saved ${
                        wishlistCount === 1
                          ? "product"
                          : "products"
                      }`}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            className="dashboard-wishlist-button"
            onClick={openWishlist}
          >
            View Wishlist →
          </button>
        </section>

        {/* RECENTLY ADDED PRODUCTS */}

        <section className="dashboard-products">
          <div className="dashboard-section-heading">
            <div>
              <p>FRESH ON THE MARKET</p>
              <h2>Recently Added Products</h2>
            </div>

            <button
              type="button"
              className="view-all-products"
              onClick={() =>
                navigateTo("/products")
              }
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
                onClick={() =>
                  navigateTo("/products")
                }
              >
                Open Buy Products
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="dashboard-product-message">
              <span>🛍️</span>

              <h3>
                No products available yet
              </h3>

              <p>
                Products uploaded by students
                will appear here.
              </p>

              <button
                type="button"
                onClick={() =>
                  navigateTo("/sell")
                }
              >
                Sell a Product
              </button>
            </div>
          ) : (
            <div className="dashboard-product-grid">
              {products.map((product, index) => {
                const imageUrl =
                  getImageUrl(product);

                const productName =
                  product.name ||
                  product.productName ||
                  product.title ||
                  "Product";

                const price = product.price;

                const productId =
                  product._id || product.id;

                return (
                  <article
                    className="dashboard-product-card"
                    key={
                      productId ||
                      `${productName}-${index}`
                    }
                  >
                    <button
                      type="button"
                      className="dashboard-product-image"
                      onClick={() =>
                        openProduct(product)
                      }
                      aria-label={`View ${productName}`}
                    >
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={productName}
                          onError={(event) => {
                            event.currentTarget.style.display =
                              "none";
                          }}
                        />
                      ) : (
                        <div className="dashboard-image-placeholder">
                          🛍️
                        </div>
                      )}
                    </button>

                    <div className="dashboard-product-info">
                      <h3 title={productName}>
                        {productName}
                      </h3>

                      <p className="dashboard-product-price">
                        {price !== undefined &&
                        price !== null &&
                        price !== "" &&
                        Number.isFinite(
                          Number(price)
                        )
                          ? `₹${Number(
                              price
                            ).toLocaleString(
                              "en-IN"
                            )}`
                          : "Price not available"}
                      </p>

                      <button
                        type="button"
                        className="dashboard-product-details"
                        onClick={() =>
                          openProduct(product)
                        }
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

        {/* FOOTER */}

        <footer className="dashboard-footer">
          © 2026 C-Mart · Campus Marketplace
          for Students
        </footer>
      </main>
    </div>
  );
}

export default Dashboard;
