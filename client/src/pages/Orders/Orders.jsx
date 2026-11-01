
import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../../services/apiConfig";
import "./Orders.css";

// IMPORTANT:
// Dashboard route in App.jsx must match this path.
const DASHBOARD_PATH = "/dashboard";

const MAX_PROOF_SIZE = 5 * 1024 * 1024;

const PAYMENT_STATUS = {
  Pending: "Pending Verification",
  Verified: "Verified",
  Rejected: "Rejected",
};

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const getList = (data) =>
  Array.isArray(data)
    ? data
    : Array.isArray(data?.orders)
    ? data.orders
    : [];

const formatPrice = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const formatDate = (value) => {
  if (!value) return "Not available";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
};

const getProofUrl = (order) => {
  const proof =
    order.paymentProof ||
    order.paymentScreenshot ||
    order.payment?.proof ||
    order.payment?.screenshot;

  if (typeof proof === "string") return proof;

  return proof?.secure_url || proof?.url || "";
};

const getPaymentStatus = (order) => {
  const raw = String(
    order.paymentStatus || order.payment?.status || ""
  ).toLowerCase();

  if (["verified", "approved", "paid"].includes(raw)) {
    return "Verified";
  }

  if (["rejected", "declined"].includes(raw)) {
    return "Rejected";
  }

  if (
    ["pending", "pending verification", "submitted"].includes(
      raw
    )
  ) {
    return "Pending";
  }

  return getProofUrl(order)
    ? "Pending"
    : "Not Submitted";
};

const getProductId = (order) => {
  const product = order.product || order.productId;

  if (typeof product === "string") return product;

  return product?._id || product?.id || "";
};

function Orders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [sellerOrders, setSellerOrders] = useState([]);

  const [activeTab, setActiveTab] = useState("buyer");
  const [filter, setFilter] = useState("All");
  const [expandedOrder, setExpandedOrder] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [updatingId, setUpdatingId] = useState("");
  const [paymentBusyId, setPaymentBusyId] = useState("");

  const [selectedFiles, setSelectedFiles] = useState({});

  // ======================================
  // HOME / DASHBOARD NAVIGATION - FIXED
  // ======================================

  const goToDashboard = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    navigate(DASHBOARD_PATH);
  };

  const goToProfile = () => {
    navigate("/profile");
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login", { replace: true });
  };

  // ======================================
  // FETCH ORDERS
  // ======================================

  const fetchOrders = useCallback(
    async ({ silent = false } = {}) => {
      if (!localStorage.getItem("token")) {
        navigate("/login", { replace: true });
        setLoading(false);
        return;
      }

      if (!silent) setLoading(true);

      setError("");

      try {
        const results = await Promise.allSettled([
          axios.get(`${API_URL}/orders/my`, {
            headers: getAuthHeaders(),
          }),

          axios.get(`${API_URL}/orders/seller`, {
            headers: getAuthHeaders(),
          }),
        ]);

        const failures = [];

        if (results[0].status === "fulfilled") {
          setOrders(getList(results[0].value.data));
        } else {
          failures.push(
            "Unable to load purchased orders."
          );
        }

        if (results[1].status === "fulfilled") {
          setSellerOrders(
            getList(results[1].value.data)
          );
        } else {
          failures.push(
            "Unable to load received orders."
          );
        }

        if (failures.length) {
          setError(failures.join(" "));
        }
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to load orders. Please try again."
        );
      } finally {
        setLoading(false);
      }
    },
    [navigate]
  );

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ======================================
  // UPDATE ORDER STATUS
  // ======================================

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
          response.data.message ||
            "Status update failed."
        );
      }

      setSellerOrders((previous) =>
        previous.map((item) =>
          item._id === order._id
            ? {
                ...item,
                status:
                  response.data?.order?.status ||
                  status,
              }
            : item
        )
      );

      setSuccess(
        "Order status updated successfully."
      );

      await fetchOrders({ silent: true });
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

  // ======================================
  // PAYMENT SCREENSHOT VALIDATION
  // ======================================

  const handleFileChange = (orderId, file) => {
    setError("");
    setSuccess("");

    if (!file) {
      setSelectedFiles((prev) => ({
        ...prev,
        [orderId]: null,
      }));
      return;
    }

    if (
      ![
        "image/jpeg",
        "image/png",
        "image/webp",
      ].includes(file.type)
    ) {
      setSelectedFiles((prev) => ({
        ...prev,
        [orderId]: null,
      }));

      setError(
        "Choose a JPG, PNG, or WebP payment screenshot."
      );
      return;
    }

    if (file.size > MAX_PROOF_SIZE) {
      setSelectedFiles((prev) => ({
        ...prev,
        [orderId]: null,
      }));

      setError(
        "Screenshot must be 5 MB or smaller."
      );
      return;
    }

    setSelectedFiles((prev) => ({
      ...prev,
      [orderId]: file,
    }));
  };

  // ======================================
  // UPLOAD PAYMENT PROOF
  // ======================================

  const handleUploadPayment = async (order) => {
    const file = selectedFiles[order._id];

    if (!file) {
      setError(
        "First select a payment screenshot."
      );
      return;
    }

    setPaymentBusyId(order._id);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();

      formData.append("screenshot", file);

      const response = await axios.post(
        `${API_URL}/orders/${order._id}/payment-proof`,
        formData,
        {
          headers: getAuthHeaders(),
        }
      );

      if (response.data?.success === false) {
        throw new Error(
          response.data.message || "Upload failed."
        );
      }

      setSelectedFiles((prev) => ({
        ...prev,
        [order._id]: null,
      }));

      setSuccess(
        "Payment proof submitted. Waiting for seller verification."
      );

      await fetchOrders({ silent: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Payment upload failed. Check the payment-proof backend route."
      );
    } finally {
      setPaymentBusyId("");
    }
  };

  // ======================================
  // VERIFY / REJECT PAYMENT
  // ======================================

  const handleVerifyPayment = async (
    order,
    status
  ) => {
    setPaymentBusyId(order._id);
    setError("");
    setSuccess("");

    try {
      const response = await axios.patch(
        `${API_URL}/orders/${order._id}/payment-status`,
        { status },
        { headers: getAuthHeaders() }
      );

      if (response.data?.success === false) {
        throw new Error(
          response.data.message ||
            "Verification failed."
        );
      }

      setSuccess(
        status === "Verified"
          ? "Payment proof marked verified."
          : "Payment proof rejected."
      );

      await fetchOrders({ silent: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Payment verification failed. Check the payment-status backend route."
      );
    } finally {
      setPaymentBusyId("");
    }
  };

  // ======================================
  // REVIEW PRODUCT
  // ======================================

  const handleReview = (order) => {
    if (order.status !== "Delivered") {
      setError(
        "You can review a product only after it has been delivered."
      );
      return;
    }

    const productId = getProductId(order);

    if (!productId) {
      setError(
        "This order has no product ID. Please check the product reference in the order data."
      );
      return;
    }

    navigate("/reviews", {
      state: {
        orderId: order._id,
        productId,
        productName:
          order.productName ||
          order.product?.name ||
          order.product?.title ||
          "Product",
      },
    });
  };

  // ======================================
  // TABS AND FILTERS
  // ======================================

  const switchTab = (tab) => {
    setActiveTab(tab);
    setFilter("All");
    setExpandedOrder(null);
    setSuccess("");
    setError("");
  };

  const currentOrders =
    activeTab === "buyer"
      ? orders
      : sellerOrders;

  const filteredOrders = currentOrders.filter(
    (order) =>
      filter === "All" ||
      (filter === "Pending"
        ? ["Processing", "Confirmed"].includes(
            order.status
          )
        : order.status === filter)
  );

  const stats = {
    total: currentOrders.length,

    pending: currentOrders.filter((o) =>
      ["Processing", "Confirmed"].includes(
        o.status
      )
    ).length,

    delivered: currentOrders.filter(
      (o) => o.status === "Delivered"
    ).length,

    cancelled: currentOrders.filter(
      (o) => o.status === "Cancelled"
    ).length,
  };

  // ======================================
  // PAGE UI
  // ======================================

  return (
    <div className="orders-page">
      {/* NAVBAR */}

      <nav className="orders-navbar">
        <button
          type="button"
          className="orders-logo"
          onClick={goToDashboard}
        >
          <span className="orders-logo-icon">
            🛍️
          </span>
          <span>C-Mart</span>
        </button>

        <div className="orders-nav-links">
          <button
            type="button"
            onClick={goToDashboard}
          >
            Home
          </button>

          <button
            type="button"
            className="active-nav"
          >
            Orders
          </button>

          <button
            type="button"
            onClick={goToProfile}
          >
            Profile
          </button>

          <button
            type="button"
            className="orders-logout"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="orders-main">
        {/* PAGE HEADER */}

        <header className="orders-header">
          <div className="orders-header-content">
            <p className="orders-label">
              MY ACCOUNT / ORDERS
            </p>

            <h1>
              Manage your <span>orders</span>
            </h1>

            <p className="orders-description">
              Track purchases, manage sales,
              payment verification and campus
              meetups — all in one place.
            </p>
          </div>

          <div className="orders-header-icon">
            📦
          </div>
        </header>

        {/* BUYER / SELLER TABS */}

        <div className="orders-tabs">
          <button
            type="button"
            className={`orders-tab ${
              activeTab === "buyer"
                ? "selected"
                : ""
            }`}
            onClick={() => switchTab("buyer")}
          >
            🛒 My Purchases
            <span>{orders.length}</span>
          </button>

          <button
            type="button"
            className={`orders-tab ${
              activeTab === "seller"
                ? "selected"
                : ""
            }`}
            onClick={() => switchTab("seller")}
          >
            📥 Received Orders
            <span>{sellerOrders.length}</span>
          </button>
        </div>

        {/* ORDER STATISTICS */}

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
            <div
              className="summary-card"
              key={stat.type}
            >
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

        {/* ALERTS */}

        {error && (
          <div
            className="orders-alert error"
            role="alert"
          >
            <span>{error}</span>

            <button
              type="button"
              onClick={() => fetchOrders()}
            >
              Refresh Orders
            </button>
          </div>
        )}

        {success && (
          <div
            className="orders-alert success"
            role="status"
          >
            {success}
          </div>
        )}

        {/* ORDERS SECTION */}

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
              type="button"
              className="back-dashboard-btn"
              onClick={goToDashboard}
            >
              ← Dashboard
            </button>
          </div>

          {/* FILTERS */}

          <div className="orders-filters">
            {[
              "All",
              "Pending",
              "Delivered",
              "Cancelled",
            ].map((item) => (
              <button
                type="button"
                key={item}
                className={`filter-btn ${
                  filter === item ? "active" : ""
                }`}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>

          {/* LOADING */}

          {loading ? (
            <div className="orders-loading">
              <div className="loading-icon">
                📦
              </div>

              <h2>Loading orders...</h2>

              <p>Please wait a moment.</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            /* EMPTY ORDERS */

            <div className="empty-orders">
              <div className="empty-orders-icon">
                📦
              </div>

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

              {activeTab === "buyer" &&
                filter === "All" && (
                  <button
                    type="button"
                    onClick={() =>
                      navigate("/products")
                    }
                  >
                    Explore Products
                  </button>
                )}
            </div>
          ) : (
            /* ORDERS LIST */

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

                const paymentStatus =
                  getPaymentStatus(order);

                const proofUrl =
                  getProofUrl(order);

                const paymentBusy =
                  paymentBusyId === order._id;

                const isCancelled =
                  order.status === "Cancelled";

                return (
                  <article
                    className="order-card"
                    key={order._id}
                  >
                    {/* ORDER SUMMARY */}

                    <div className="order-card-main">
                      <div className="order-product-icon">
                        📦
                      </div>

                      <div className="order-details">
                        <div className="order-title-row">
                          <h3>{productName}</h3>

                          <span
                            className={`status-badge ${String(
                              order.status ||
                                "Processing"
                            ).toLowerCase()}`}
                          >
                            <span className="status-dot" />
                            {order.status ||
                              "Processing"}
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
                            📅{" "}
                            {formatDate(
                              order.createdAt
                            )}
                          </span>

                          <span>
                            Order #
                            {String(
                              order._id
                            )
                              .slice(-8)
                              .toUpperCase()}
                          </span>
                        </div>

                        <p className="order-subtitle">
                          Payment:{" "}
                          <strong>
                            {PAYMENT_STATUS[
                              paymentStatus
                            ] || paymentStatus}
                          </strong>
                        </p>
                      </div>

                      <div className="order-price-area">
                        <strong>
                          {formatPrice(
                            order.price
                          )}
                        </strong>

                        <button
                          type="button"
                          className="order-details-btn"
                          onClick={() =>
                            setExpandedOrder(
                              isExpanded
                                ? null
                                : order._id
                            )
                          }
                          aria-expanded={
                            isExpanded
                          }
                        >
                          {isExpanded
                            ? "Hide Details ↑"
                            : "View Details ↓"}
                        </button>
                      </div>
                    </div>

                    {/* EXPANDED DETAILS */}

                    {isExpanded && (
                      <div className="order-expanded">
                        <div className="order-expanded-grid">
                          {/* ORDER INFORMATION */}

                          <div className="order-detail-panel">
                            <h4>
                              📦 Order Information
                            </h4>

                            <div className="detail-line">
                              <span>Order ID</span>

                              <strong>
                                #
                                {String(
                                  order._id
                                )
                                  .slice(-8)
                                  .toUpperCase()}
                              </strong>
                            </div>

                            <div className="detail-line">
                              <span>Quantity</span>

                              <strong>
                                {order.quantity ||
                                  1}
                              </strong>
                            </div>

                            <div className="detail-line">
                              <span>Price</span>

                              <strong>
                                {formatPrice(
                                  order.price
                                )}
                              </strong>
                            </div>

                            <div className="detail-line">
                              <span>Status</span>

                              <strong>
                                {order.status ||
                                  "Processing"}
                              </strong>
                            </div>
                          </div>

                          {/* MEETING DETAILS */}

                          <div className="order-detail-panel">
                            <h4>
                              📍 Meeting Details
                            </h4>

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
                                      /^\d{4}-\d{2}-\d{2}$/.test(
                                        order.meetingDate
                                      )
                                        ? `${order.meetingDate}T12:00:00`
                                        : order.meetingDate
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

                          {/* USER DETAILS */}

                          <div className="order-detail-panel">
                            <h4>
                              👤{" "}
                              {activeTab ===
                              "buyer"
                                ? "Seller Details"
                                : "Buyer Details"}
                            </h4>

                            <div className="detail-line">
                              <span>Name</span>

                              <strong>
                                {personName}
                              </strong>
                            </div>

                            {activeTab ===
                              "seller" && (
                              <div className="detail-line">
                                <span>
                                  Email
                                </span>

                                <strong>
                                  {order.buyer
                                    ?.email ||
                                    "Not available"}
                                </strong>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* PAYMENT VERIFICATION */}

                        <section
                          className="order-detail-panel"
                          style={{
                            marginTop: 18,
                          }}
                        >
                          <h4>
                            💳 Payment Verification
                          </h4>

                          <div className="detail-line">
                            <span>
                              Payment status
                            </span>

                            <strong>
                              {PAYMENT_STATUS[
                                paymentStatus
                              ] || paymentStatus}
                            </strong>
                          </div>

                          {/* PAYMENT PROOF IMAGE */}

                          {proofUrl && (
                            <div
                              style={{
                                marginTop: 12,
                              }}
                            >
                              <p>
                                Submitted payment
                                screenshot:
                              </p>

                              <a
                                href={proofUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Open payment proof"
                              >
                                <img
                                  src={proofUrl}
                                  alt="Submitted payment proof"
                                  style={{
                                    maxWidth: 260,
                                    width: "100%",
                                    maxHeight: 230,
                                    objectFit:
                                      "contain",
                                    borderRadius: 10,
                                    border:
                                      "1px solid #cbd5e1",
                                  }}
                                />
                              </a>
                            </div>
                          )}

                          {/* BUYER UPLOAD */}

                          {activeTab ===
                            "buyer" &&
                            !isCancelled &&
                            ![
                              "Verified",
                              "Pending",
                            ].includes(
                              paymentStatus
                            ) && (
                              <div
                                style={{
                                  marginTop: 15,
                                }}
                              >
                                <label
                                  htmlFor={`proof-${order._id}`}
                                  style={{
                                    display:
                                      "block",
                                    fontWeight:
                                      700,
                                    marginBottom:
                                      8,
                                  }}
                                >
                                  Upload Payment
                                  Screenshot (JPG,
                                  PNG or WebP, max
                                  5 MB)
                                </label>

                                <input
                                  id={`proof-${order._id}`}
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp"
                                  disabled={
                                    paymentBusy
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    handleFileChange(
                                      order._id,
                                      event.target
                                        .files?.[0]
                                    )
                                  }
                                />

                                <button
                                  type="button"
                                  className="review-btn"
                                  style={{
                                    display:
                                      "block",
                                    marginTop:
                                      12,
                                  }}
                                  disabled={
                                    paymentBusy ||
                                    !selectedFiles[
                                      order._id
                                    ]
                                  }
                                  onClick={() =>
                                    handleUploadPayment(
                                      order
                                    )
                                  }
                                >
                                  {paymentBusy
                                    ? "Uploading..."
                                    : paymentStatus ===
                                      "Rejected"
                                    ? "Resubmit Payment Proof"
                                    : "Upload Payment Proof"}
                                </button>
                              </div>
                            )}

                          {/* PAYMENT MESSAGES */}

                          {activeTab ===
                            "buyer" &&
                            paymentStatus ===
                              "Pending" && (
                              <p className="review-message">
                                Your screenshot is
                                waiting for seller
                                verification.
                              </p>
                            )}

                          {activeTab ===
                            "buyer" &&
                            paymentStatus ===
                              "Verified" && (
                              <p className="review-message">
                                Payment proof
                                marked verified by
                                seller.
                              </p>
                            )}

                          {/* SELLER VERIFICATION */}

                          {activeTab ===
                            "seller" &&
                            proofUrl &&
                            paymentStatus ===
                              "Pending" &&
                            !isCancelled && (
                              <div
                                style={{
                                  display:
                                    "flex",
                                  flexWrap:
                                    "wrap",
                                  gap: 10,
                                  marginTop:
                                    14,
                                }}
                              >
                                <button
                                  type="button"
                                  className="review-btn"
                                  disabled={
                                    paymentBusy
                                  }
                                  onClick={() =>
                                    handleVerifyPayment(
                                      order,
                                      "Verified"
                                    )
                                  }
                                >
                                  {paymentBusy
                                    ? "Updating..."
                                    : "✓ Verify Payment"}
                                </button>

                                <button
                                  type="button"
                                  className="back-dashboard-btn"
                                  disabled={
                                    paymentBusy
                                  }
                                  onClick={() =>
                                    handleVerifyPayment(
                                      order,
                                      "Rejected"
                                    )
                                  }
                                >
                                  ✕ Reject Proof
                                </button>
                              </div>
                            )}

                          {activeTab ===
                            "seller" && (
                              <p
                                style={{
                                  fontSize: 12,
                                  color:
                                    "#64748b",
                                  marginTop:
                                    12,
                                }}
                              >
                                A screenshot alone
                                does not confirm
                                payment. Check your
                                actual bank or UPI
                                transaction record
                                before approving.
                              </p>
                            )}
                        </section>

                        {/* ORDER ACTIONS */}

                        <div className="order-actions">
                          {activeTab ===
                            "buyer" &&
                            (order.status ===
                            "Delivered" ? (
                              <button
                                type="button"
                                className="review-btn"
                                onClick={() =>
                                  handleReview(
                                    order
                                  )
                                }
                              >
                                ⭐ Rate &amp;
                                Review
                              </button>
                            ) : (
                              !isCancelled && (
                                <p className="review-message">
                                  ⭐ Rate &amp;
                                  Review will be
                                  available once
                                  the product is
                                  delivered.
                                </p>
                              )
                            ))}

                          {/* SELLER STATUS UPDATE */}

                          {activeTab ===
                            "seller" &&
                            ![
                              "Delivered",
                              "Cancelled",
                            ].includes(
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
                                  value={
                                    order.status ||
                                    "Processing"
                                  }
                                  disabled={
                                    updatingId ===
                                    order._id
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    handleUpdateStatus(
                                      order,
                                      event.target
                                        .value
                                    )
                                  }
                                >
                                  <option
                                    value={
                                      order.status ||
                                      "Processing"
                                    }
                                  >
                                    {order.status ||
                                      "Processing"}
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
                                      Mark as
                                      Delivered
                                    </option>
                                  )}

                                  <option value="Cancelled">
                                    Cancel Order
                                  </option>
                                </select>

                                {updatingId ===
                                  order._id && (
                                  <span>
                                    Updating...
                                  </span>
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

      {/* FOOTER */}

      <footer className="orders-footer">
        <div className="footer-brand">
          🛍️ C-Mart
        </div>

        <p>
          Campus Marketplace • Buy • Sell •
          Swap • Rent
        </p>
      </footer>
    </div>
  );
}

export default Orders;
