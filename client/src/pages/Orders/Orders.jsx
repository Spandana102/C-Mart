
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Orders.css";

const API_URL = "http://localhost:5000/api";

function Orders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [sellerOrders, setSellerOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("buyer");
  const [filter, setFilter] = useState("All");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  const fetchOrders = async () => {
    setLoading(true);
    setError("");

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      setLoading(false);
      return;
    }

    try {
      const results = await Promise.allSettled([
        axios.get(`${API_URL}/orders/my`, {
          headers: getAuthHeaders(),
        }),
        axios.get(`${API_URL}/orders/seller`, {
          headers: getAuthHeaders(),
        }),
      ]);

      const [buyerResult, sellerResult] = results;
      const errors = [];

      if (buyerResult.status === "fulfilled") {
        const data = buyerResult.value.data;
        setOrders(
          Array.isArray(data)
            ? data
            : Array.isArray(data.orders)
            ? data.orders
            : []
        );
      } else {
        setOrders([]);
        errors.push("Unable to load purchased orders.");
      }

      if (sellerResult.status === "fulfilled") {
        const data = sellerResult.value.data;
        setSellerOrders(
          Array.isArray(data)
            ? data
            : Array.isArray(data.orders)
            ? data.orders
            : []
        );
      } else {
        setSellerOrders([]);
        errors.push("Unable to load received orders.");
      }

      setError(errors.join(" "));
    } catch (err) {
      console.error("Fetch orders error:", err);
      setError("Unable to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (order, status) => {
    if (!status || status === order.status) return;

    setUpdatingId(order._id);
    setError("");
    setSuccess("");

    try {
      const response = await axios.patch(
        `${API_URL}/orders/${order._id}/status`,
        { status },
        { headers: getAuthHeaders() }
      );

      if (response.data?.success === false) {
        throw new Error(
          response.data.message || "Status update failed."
        );
      }

      setSellerOrders((previous) =>
        previous.map((item) =>
          item._id === order._id
            ? {
                ...item,
                status: response.data?.order?.status || status,
              }
            : item
        )
      );

      setSuccess("Order status updated successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to update order."
      );
    } finally {
      setUpdatingId("");
    }
  };

  const handleReview = (order) => {
    navigate("/reviews", {
      state: {
        orderId: order._id,
        productId: order.product?._id || order.product,
        productName: order.productName,
      },
    });
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setFilter("All");
    setExpandedOrder(null);
    setSuccess("");
  };

  const formatPrice = (price) =>
    `₹${Number(price || 0).toLocaleString("en-IN")}`;

  const formatDate = (date) => {
    if (!date) return "Not available";
    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime())
      ? date
      : parsed.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
  };

  const getStatusClass = (status) =>
    String(status || "Processing").toLowerCase();

  const currentOrders =
    activeTab === "buyer" ? orders : sellerOrders;

  const filteredOrders = currentOrders.filter((order) => {
    if (filter === "All") return true;

    if (filter === "Pending") {
      return (
        order.status === "Processing" ||
        order.status === "Confirmed"
      );
    }

    return order.status === filter;
  });

  const stats = {
    total: currentOrders.length,
    pending: currentOrders.filter(
      (o) =>
        o.status === "Processing" ||
        o.status === "Confirmed"
    ).length,
    delivered: currentOrders.filter(
      (o) => o.status === "Delivered"
    ).length,
    cancelled: currentOrders.filter(
      (o) => o.status === "Cancelled"
    ).length,
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="orders-page">
      {/* NAVBAR */}
      <nav className="orders-navbar">
        <button
          className="orders-logo"
          onClick={() => navigate("/")}
          type="button"
        >
          <span className="orders-logo-icon">🛍️</span>
          <span>C-Mart</span>
        </button>

        <div className="orders-nav-links">
          <button onClick={() => navigate("/")}>
            Home
          </button>

          <button className="active-nav">
            Orders
          </button>

          <button onClick={() => navigate("/profile")}>
            Profile
          </button>

          <button
            className="orders-logout"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="orders-main">
        {/* HEADER */}
        <header className="orders-header">
          <div className="orders-header-content">
            <p className="orders-label">
              MY ACCOUNT / ORDERS
            </p>

            <h1>
              Manage your <span>orders</span>
            </h1>

            <p className="orders-description">
              Track purchases, manage sales and coordinate
              campus meetups — all in one place.
            </p>
          </div>

          <div className="orders-header-icon">📦</div>
        </header>

        {/* TABS */}
        <div className="orders-tabs">
          <button
            className={`orders-tab ${
              activeTab === "buyer" ? "selected" : ""
            }`}
            onClick={() => switchTab("buyer")}
          >
            🛒 My Purchases
            <span>{orders.length}</span>
          </button>

          <button
            className={`orders-tab ${
              activeTab === "seller" ? "selected" : ""
            }`}
            onClick={() => switchTab("seller")}
          >
            📥 Received Orders
            <span>{sellerOrders.length}</span>
          </button>
        </div>

        {/* SUMMARY */}
        <section className="orders-summary">
          {[
            {
              label: "Total Orders",
              value: stats.total,
              icon: "📦",
              type: "total",
            },
            {
              label: "In Progress",
              value: stats.pending,
              icon: "🕒",
              type: "pending",
            },
            {
              label: "Delivered",
              value: stats.delivered,
              icon: "✓",
              type: "delivered",
            },
            {
              label: "Cancelled",
              value: stats.cancelled,
              icon: "✕",
              type: "cancelled",
            },
          ].map((stat) => (
            <div className="summary-card" key={stat.type}>
              <div
                className={`summary-icon ${stat.type}-icon`}
              >
                {stat.icon}
              </div>

              <div className="summary-content">
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </div>
            </div>
          ))}
        </section>

        {/* MESSAGES */}
        {error && (
          <div className="orders-alert error" role="alert">
            <span>{error}</span>
            <button onClick={fetchOrders}>Retry</button>
          </div>
        )}

        {success && (
          <div className="orders-alert success" role="status">
            {success}
          </div>
        )}

        {/* CONTENT */}
        <section className="orders-container">
          <div className="orders-section-title">
            <div>
              <p>
                {activeTab === "buyer"
                  ? "PURCHASE HISTORY"
                  : "SALES MANAGEMENT"}
              </p>

              <h2>
                {activeTab === "buyer"
                  ? "My Purchases"
                  : "Received Orders"}
              </h2>
            </div>

            <button
              className="back-dashboard-btn"
              onClick={() => navigate("/")}
            >
              ← Dashboard
            </button>
          </div>

          {/* FILTERS */}
          <div className="orders-filters">
            {["All", "Pending", "Delivered", "Cancelled"].map(
              (item) => (
                <button
                  key={item}
                  className={`filter-btn ${
                    filter === item ? "active" : ""
                  }`}
                  onClick={() => setFilter(item)}
                >
                  {item}
                </button>
              )
            )}
          </div>

          {loading ? (
            <div className="orders-loading">
              <div className="loading-icon">📦</div>
              <h2>Loading orders...</h2>
              <p>Please wait a moment.</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="empty-orders">
              <div className="empty-orders-icon">📦</div>
              <h2>
                {filter !== "All"
                  ? `No ${filter.toLowerCase()} orders`
                  : activeTab === "buyer"
                  ? "No purchases yet"
                  : "No received orders yet"}
              </h2>

              <p>
                {filter !== "All"
                  ? "Try selecting another order status."
                  : activeTab === "buyer"
                  ? "Products you purchase will appear here."
                  : "Orders placed for your products will appear here."}
              </p>

              {activeTab === "buyer" && filter === "All" && (
                <button
                  onClick={() => navigate("/products")}
                >
                  Explore Products
                </button>
              )}
            </div>
          ) : (
            <div className="orders-list">
              {filteredOrders.map((order) => {
                const isExpanded =
                  expandedOrder === order._id;

                const productName =
                  order.productName ||
                  order.product?.name ||
                  order.product?.title ||
                  "Product";

                const personName =
                  activeTab === "buyer"
                    ? order.seller?.fullName ||
                      "Seller not available"
                    : order.buyer?.fullName ||
                      "Buyer not available";

                return (
                  <article
                    className="order-card"
                    key={order._id}
                  >
                    {/* COMPACT CARD HEADER */}
                    <div className="order-card-main">
                      <div className="order-product-icon">
                        📦
                      </div>

                      <div className="order-details">
                        <div className="order-title-row">
                          <h3>{productName}</h3>

                          <span
                            className={`status-badge ${getStatusClass(
                              order.status
                            )}`}
                          >
                            <span className="status-dot" />
                            {order.status || "Processing"}
                          </span>
                        </div>

                        <p className="order-subtitle">
                          {activeTab === "buyer"
                            ? "Seller"
                            : "Buyer"}
                          : {personName}
                        </p>

                        <div className="order-meta">
                          <span>
                            📅 {formatDate(order.createdAt)}
                          </span>
                          <span>
                            Order #
                            {String(order._id)
                              .slice(-8)
                              .toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="order-price-area">
                        <strong>
                          {formatPrice(order.price)}
                        </strong>

                        <button
                          className="order-details-btn"
                          onClick={() =>
                            setExpandedOrder(
                              isExpanded ? null : order._id
                            )
                          }
                          aria-expanded={isExpanded}
                        >
                          {isExpanded
                            ? "Hide Details ↑"
                            : "View Details ↓"}
                        </button>
                      </div>
                    </div>

                    {/* EXPANDABLE DETAILS */}
                    {isExpanded && (
                      <div className="order-expanded">
                        <div className="order-expanded-grid">
                          <div className="order-detail-panel">
                            <h4>📦 Order Information</h4>

                            <div className="detail-line">
                              <span>Order ID</span>
                              <strong>
                                #
                                {String(order._id)
                                  .slice(-8)
                                  .toUpperCase()}
                              </strong>
                            </div>

                            <div className="detail-line">
                              <span>Quantity</span>
                              <strong>
                                {order.quantity || 1}
                              </strong>
                            </div>

                            <div className="detail-line">
                              <span>Price</span>
                              <strong>
                                {formatPrice(order.price)}
                              </strong>
                            </div>

                            <div className="detail-line">
                              <span>Status</span>
                              <strong>
                                {order.status}
                              </strong>
                            </div>
                          </div>

                          <div className="order-detail-panel">
                            <h4>📍 Meeting Details</h4>

                            <div className="detail-line">
                              <span>Meet Point</span>
                              <strong>
                                {order.meetPoint ||
                                  "Not selected"}
                              </strong>
                            </div>

                            <div className="detail-line">
                              <span>Date</span>
                              <strong>
                                {order.meetingDate
                                  ? formatDate(
                                      `${order.meetingDate}T12:00:00`
                                    )
                                  : "Not selected"}
                              </strong>
                            </div>

                            <div className="detail-line">
                              <span>Time</span>
                              <strong>
                                {order.meetingTime ||
                                  "Not selected"}
                              </strong>
                            </div>
                          </div>

                          <div className="order-detail-panel">
                            <h4>
                              👤{" "}
                              {activeTab === "buyer"
                                ? "Seller Details"
                                : "Buyer Details"}
                            </h4>

                            <div className="detail-line">
                              <span>Name</span>
                              <strong>{personName}</strong>
                            </div>

                            {activeTab === "seller" && (
                              <div className="detail-line">
                                <span>Email</span>
                                <strong>
                                  {order.buyer?.email ||
                                    "Not available"}
                                </strong>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* ACTIONS */}
                        <div className="order-actions">
                          {activeTab === "buyer" &&
                            (order.status === "Delivered" ? (
                              <button
                                className="review-btn"
                                onClick={() =>
                                  handleReview(order)
                                }
                              >
                                ⭐ Rate & Review
                              </button>
                            ) : (
                              <p className="review-message">
                                Reviews are available after
                                delivery.
                              </p>
                            ))}

                          {activeTab === "seller" &&
                            !["Delivered", "Cancelled"].includes(
                              order.status
                            ) && (
                              <div className="status-update-box">
                                <label
                                  htmlFor={`status-${order._id}`}
                                >
                                  Update Status
                                </label>

                                <select
                                  id={`status-${order._id}`}
                                  value={order.status}
                                  disabled={
                                    updatingId === order._id
                                  }
                                  onChange={(e) =>
                                    handleUpdateStatus(
                                      order,
                                      e.target.value
                                    )
                                  }
                                >
                                  <option value={order.status}>
                                    {order.status}
                                  </option>

                                  {order.status ===
                                    "Processing" && (
                                    <option value="Confirmed">
                                      Confirm Order
                                    </option>
                                  )}

                                  {order.status ===
                                    "Confirmed" && (
                                    <option value="Delivered">
                                      Mark as Delivered
                                    </option>
                                  )}

                                  <option value="Cancelled">
                                    Cancel Order
                                  </option>
                                </select>

                                {updatingId === order._id && (
                                  <span>Updating...</span>
                                )}
                              </div>
                            )}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <footer className="orders-footer">
        <div className="footer-brand">🛍️ C-Mart</div>
        <p>Campus Marketplace • Buy • Sell • Swap • Rent</p>
      </footer>
    </div>
  );
}

export default Orders;
