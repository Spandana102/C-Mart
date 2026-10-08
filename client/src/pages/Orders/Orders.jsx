import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Orders.css";

function Orders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const storedUser = localStorage.getItem("user");

      if (!storedUser) {
        alert("Please login to view your orders.");
        navigate("/login");
        return;
      }

      const user = JSON.parse(storedUser);

      if (!user._id) {
        alert("User information is missing. Please login again.");
        navigate("/login");
        return;
      }

      const response = await axios.get(
        `http://localhost:5000/api/orders/user/${user._id}`
      );

      setOrders(response.data);
    } catch (error) {
      console.error("Fetch orders error:", error);

      alert(
        error.response?.data?.message ||
          "Failed to load orders."
      );
    } finally {
      setLoading(false);
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

  const getStatusClass = (status) => {
    if (status === "Delivered") return "delivered";
    if (status === "Cancelled") return "cancelled";
    return "pending";
  };

  if (loading) {
    return (
      <div className="orders-page">
        <nav className="orders-navbar">
          <div
            className="orders-logo"
            onClick={() => navigate("/")}
          >
            <span className="orders-logo-icon">🛍️</span>
            <span>C-Mart</span>
          </div>

          <div className="orders-nav-links">
            <button onClick={() => navigate("/")}>
              Home
            </button>

            <button
              className="active-nav"
              onClick={() => navigate("/orders")}
            >
              Orders
            </button>

            <button onClick={() => navigate("/profile")}>
              Profile
            </button>
          </div>
        </nav>

        <div className="orders-loading">
          <div className="loading-icon">📦</div>
          <h2>Loading your orders...</h2>
          <p>Please wait while we fetch your order details.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">

      {/* ================= NAVBAR ================= */}

      <nav className="orders-navbar">
        <div
          className="orders-logo"
          onClick={() => navigate("/")}
        >
          <span className="orders-logo-icon">🛍️</span>
          <span>C-Mart</span>
        </div>

        <div className="orders-nav-links">
          <button onClick={() => navigate("/")}>
            Home
          </button>

          <button
            className="active-nav"
            onClick={() => navigate("/orders")}
          >
            Orders
          </button>

          <button onClick={() => navigate("/profile")}>
            Profile
          </button>

          <button
            className="orders-logout"
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

      {/* ================= HEADER ================= */}

      <section className="orders-header">
        <div className="orders-header-content">
          <p className="orders-label">
            C-MART • YOUR ACTIVITY
          </p>

          <h1>
            My <span>Orders</span>
          </h1>

          <p className="orders-description">
            View your purchased products, track order status,
            and review your delivered products.
          </p>
        </div>

        <div className="orders-header-icon">
          📦
        </div>
      </section>

      {/* ================= ORDER SUMMARY ================= */}

      <section className="orders-summary">

        <div className="summary-card">
          <div className="summary-icon">📦</div>
          <div>
            <span>Total Orders</span>
            <strong>{orders.length}</strong>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon delivered-icon">
            ✓
          </div>
          <div>
            <span>Delivered</span>
            <strong>
              {
                orders.filter(
                  (order) => order.status === "Delivered"
                ).length
              }
            </strong>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon pending-icon">
            ⏳
          </div>
          <div>
            <span>Pending</span>
            <strong>
              {
                orders.filter(
                  (order) =>
                    order.status !== "Delivered" &&
                    order.status !== "Cancelled"
                ).length
              }
            </strong>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon cancelled-icon">
            ✕
          </div>
          <div>
            <span>Cancelled</span>
            <strong>
              {
                orders.filter(
                  (order) => order.status === "Cancelled"
                ).length
              }
            </strong>
          </div>
        </div>

      </section>

      {/* ================= ORDERS ================= */}

      <section className="orders-container">

        <div className="orders-section-title">
          <div>
            <p>ORDER HISTORY</p>
            <h2>Your Recent Orders</h2>
          </div>

          <button
            className="back-dashboard-btn"
            onClick={() => navigate("/")}
          >
            ← Dashboard
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="empty-orders">

            <div className="empty-orders-icon">
              🛒
            </div>

            <h2>No orders yet</h2>

            <p>
              Your purchased products will appear here.
              Start exploring the C-Mart marketplace.
            </p>

            <button
              onClick={() => navigate("/products")}
            >
              Explore Marketplace →
            </button>

          </div>
        ) : (
          <div className="orders-list">

            {orders.map((order) => (
              <div
                className="order-card"
                key={order._id}
              >

                {/* Product Icon */}

                <div className="order-product-icon">
                  📦
                </div>

                {/* Product Details */}

                <div className="order-details">

                  <div className="order-title-row">
                    <h3>
                      {order.productName}
                    </h3>

                    <span
                      className={`status-badge ${getStatusClass(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div className="order-info-grid">

                    <div className="order-info">
                      <span>Price</span>
                      <strong>
                        ₹{order.price}
                      </strong>
                    </div>

                    <div className="order-info">
                      <span>Order Date</span>
                      <strong>
                        {new Date(
                          order.createdAt
                        ).toLocaleDateString()}
                      </strong>
                    </div>

                    <div className="order-info">
                      <span>Order ID</span>
                      <strong>
                        #{order._id.slice(-8).toUpperCase()}
                      </strong>
                    </div>

                  </div>

                  {/* Review */}

                  {order.status === "Delivered" ? (
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
                      Review will be available after delivery.
                    </p>
                  )}

                </div>

              </div>
            ))}

          </div>
        )}

      </section>

      {/* ================= FOOTER ================= */}

      <footer className="orders-footer">
        <div className="footer-brand">
          🛍️ C-Mart
        </div>

        <p>
          Campus Marketplace • Buy • Sell • Swap • Rent
        </p>
      </footer>

    </div>
  );
}

export default Orders;