
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_ORIGIN, API_URL } from "../services/apiConfig";

const money = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });

function getImageUrl(image) {
  if (!image) return "";

  if (Array.isArray(image)) {
    return image.map(getImageUrl).find(Boolean) || "";
  }

  if (typeof image === "object") {
    return getImageUrl(
      image.secure_url ||
        image.url ||
        image.imageUrl ||
        image.path ||
        image.src
    );
  }

  if (typeof image !== "string") return "";

  const url = image.trim().replace(/\\/g, "/");

  if (!url) return "";

  if (
    /^https?:\/\//i.test(url) ||
    url.startsWith("data:image/") ||
    url.startsWith("blob:")
  ) {
    return url;
  }

  if (url.startsWith("//")) {
    return `https:${url}`;
  }

  return `${API_ORIGIN}/${url.replace(/^\/+/, "")}`;
}

const FILTERS = [
  "All",
  "Pending",
  "Accepted",
  "Rejected",
  "Countered",
];

function SellerOffers() {
  const navigate = useNavigate();

  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyId, setBusyId] = useState("");
  const [filter, setFilter] = useState("All");
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [counterPrice, setCounterPrice] = useState("");

  // ========================================
  // DASHBOARD NAVIGATION
  // ========================================

  const goToDashboard = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    navigate("/dashboard");
  };

  // ========================================
  // API REQUEST
  // ========================================

  const apiRequest = useCallback(
    async (path, options = {}) => {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Please login to view seller offers.");
      }

      let response;

      try {
        response = await fetch(`${API_URL}${path}`, {
          ...options,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...options.headers,
          },
        });
      } catch {
        throw new Error(
          "Cannot connect to server. Check that backend is running."
        );
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.success === false) {
        throw new Error(
          data.message || `Request failed (${response.status})`
        );
      }

      return data;
    },
    []
  );

  // ========================================
  // FETCH SELLER OFFERS
  // ========================================

  const loadOffers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest("/bargaining/seller");

      const offerList = Array.isArray(data.offers)
        ? data.offers
        : Array.isArray(data.data?.offers)
        ? data.data.offers
        : Array.isArray(data)
        ? data
        : null;

      if (!offerList) {
        throw new Error("Invalid offers response from server.");
      }

      setOffers(offerList);
    } catch (err) {
      setError(err.message || "Unable to load seller offers.");
    } finally {
      setLoading(false);
    }
  }, [apiRequest]);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  // ========================================
  // ACCEPT / REJECT / COUNTER
  // ========================================

  const updateOffer = async (offer, action, body = {}) => {
    if (busyId || !offer?._id) return;

    setBusyId(String(offer._id));
    setError("");
    setSuccess("");

    try {
      await apiRequest(
        `/bargaining/${offer._id}/${action}`,
        {
          method: "PATCH",
          body: JSON.stringify(body),
        }
      );

      const messages = {
        accept: "Offer accepted successfully!",
        reject: "Offer rejected successfully.",
        counter: "Counter offer sent successfully!",
      };

      setSelectedOffer(null);
      setCounterPrice("");

      await loadOffers();

      setSuccess(
        messages[action] || "Offer updated successfully."
      );
    } catch (err) {
      setError(err.message || "Failed to update offer.");
    } finally {
      setBusyId("");
    }
  };

  const sendCounter = async () => {
    const price = Number(counterPrice);

    if (
      counterPrice.trim() === "" ||
      !Number.isFinite(price) ||
      price <= 0
    ) {
      setError("Please enter a valid counter price.");
      return;
    }

    if (!selectedOffer) return;

    await updateOffer(selectedOffer, "counter", {
      counterPrice: price,
    });
  };

  // ========================================
  // COUNTS AND FILTERS
  // ========================================

  const pendingCount = offers.filter(
    (offer) => (offer.status || "Pending") === "Pending"
  ).length;

  const acceptedCount = offers.filter(
    (offer) => offer.status === "Accepted"
  ).length;

  const counteredCount = offers.filter(
    (offer) => offer.status === "Countered"
  ).length;

  const rejectedCount = offers.filter(
    (offer) => offer.status === "Rejected"
  ).length;

  const filteredOffers =
    filter === "All"
      ? offers
      : offers.filter(
          (offer) =>
            (offer.status || "Pending") === filter
        );

  const stats = [
    {
      label: "Total Offers",
      value: offers.length,
      icon: "📨",
      type: "total",
    },
    {
      label: "Pending",
      value: pendingCount,
      icon: "⏳",
      type: "pending",
    },
    {
      label: "Accepted",
      value: acceptedCount,
      icon: "✅",
      type: "accepted",
    },
    {
      label: "Countered",
      value: counteredCount,
      icon: "💰",
      type: "countered",
    },
  ];

  // ========================================
  // UI
  // ========================================

  return (
    <div className="so-page">
      {/* CSS INSIDE SAME JSX FILE */}
      <style>{sellerOffersCSS}</style>

      {/* NAVBAR */}

      <header className="so-navbar">
        <button
          type="button"
          className="so-logo"
          onClick={goToDashboard}
        >
          🛍️ C-MART
        </button>

        <div className="so-nav-actions">
          <button
            type="button"
            className="so-nav-link"
            onClick={() => navigate("/products")}
          >
            Marketplace
          </button>

          <button
            type="button"
            className="so-dashboard-btn"
            onClick={goToDashboard}
          >
            ← Dashboard
          </button>
        </div>
      </header>

      <main className="so-container">
        {/* HEADING */}

        <section className="so-heading-section">
          <div>
            <p className="so-label">
              C-MART SELLER DASHBOARD
            </p>

            <h1>Incoming Bargain Offers</h1>

            <p className="so-subtitle">
              Review and manage price offers received
              for your listed campus products.
            </p>
          </div>

          <button
            type="button"
            className="so-refresh-btn"
            onClick={loadOffers}
            disabled={loading || Boolean(busyId)}
          >
            {loading ? "Loading..." : "↻ Refresh Offers"}
          </button>
        </section>

        {/* STATISTICS */}

        <section className="so-stats-grid">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={`so-stat-card so-stat-${stat.type}`}
            >
              <div className="so-stat-top">
                <span>{stat.label}</span>
                <span className="so-stat-icon">
                  {stat.icon}
                </span>
              </div>

              <strong>{stat.value}</strong>
            </div>
          ))}
        </section>

        {/* MESSAGES */}

        {success && (
          <div className="so-success" role="status">
            <span>✓ {success}</span>

            <button
              type="button"
              onClick={() => setSuccess("")}
              aria-label="Dismiss success"
            >
              ×
            </button>
          </div>
        )}

        {error && (
          <div className="so-error" role="alert">
            <span>⚠️ {error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        {/* FILTERS */}

        <section className="so-filter-section">
          <div className="so-filter-heading">
            <div>
              <h2>Manage Offers</h2>
              <p>
                Filter offers by their current status.
              </p>
            </div>

            <span className="so-offer-count">
              {filteredOffers.length} Offers
            </span>
          </div>

          <div className="so-filter-row">
            {FILTERS.map((item) => (
              <button
                type="button"
                key={item}
                className={`so-filter-btn ${
                  filter === item ? "active" : ""
                }`}
                onClick={() => setFilter(item)}
                aria-pressed={filter === item}
              >
                {item}
                {item === "Rejected" && (
                  <span className="so-filter-count">
                    {rejectedCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* LOADING / EMPTY / OFFERS */}

        {loading ? (
          <div className="so-empty">
            <div className="so-empty-icon">⏳</div>
            <h2>Loading Seller Offers...</h2>
            <p>
              Fetching the latest bargaining requests.
            </p>
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="so-empty">
            <div className="so-empty-icon">📭</div>

            <h2>
              {error
                ? "Could Not Load Offers"
                : filter === "All"
                ? "No Offers Yet"
                : `No ${filter} Offers`}
            </h2>

            <p>
              {error
                ? "Please check the error message and try again."
                : "Buyer requests for your listed products will appear here."}
            </p>

            <button
              type="button"
              className="so-primary-btn"
              onClick={loadOffers}
            >
              ↻ Check Again
            </button>
          </div>
        ) : (
          <div className="so-offers-list">
            {filteredOffers.map((offer) => {
              const product =
                offer.productId &&
                typeof offer.productId === "object"
                  ? offer.productId
                  : {};

              const buyer =
                offer.buyerId &&
                typeof offer.buyerId === "object"
                  ? offer.buyerId
                  : {};

              const productName =
                product.name ||
                product.productName ||
                "Product";

              const image = getImageUrl(
                product.images ||
                  product.image ||
                  product.imageUrl
              );

              const status = offer.status || "Pending";
              const isBusy = Boolean(busyId);

              return (
                <article
                  key={offer._id}
                  className="so-offer-card"
                >
                  <div className="so-product-section">
                    <div className="so-image-box">
                      {image ? (
                        <img
                          src={image}
                          alt={productName}
                          onError={(event) => {
                            event.currentTarget.style.display =
                              "none";
                          }}
                        />
                      ) : (
                        <span>📦</span>
                      )}
                    </div>

                    <div className="so-product-info">
                      <span className="so-product-label">
                        BARGAIN REQUEST
                      </span>

                      <h2>{productName}</h2>

                      <p className="so-muted">
                        👤 Buyer:{" "}
                        <strong>
                          {buyer.fullName ||
                            "C-Mart User"}
                        </strong>
                      </p>

                      <p className="so-muted">
                        Listed Price: ₹
                        {money(product.price)}
                      </p>

                      <div className="so-price-box">
                        <span>Buyer's Offer</span>

                        <strong>
                          ₹{money(offer.offerPrice)}
                        </strong>
                      </div>

                      {offer.counterPrice != null && (
                        <p className="so-counter-price">
                          Seller Counter: ₹
                          {money(offer.counterPrice)}
                        </p>
                      )}

                      {offer.createdAt && (
                        <p className="so-date">
                          Received:{" "}
                          {new Date(
                            offer.createdAt
                          ).toLocaleString("en-IN")}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="so-action-section">
                    <span
                      className={`so-status so-status-${status.toLowerCase()}`}
                    >
                      {status}
                    </span>

                    {status === "Pending" && (
                      <div className="so-action-buttons">
                        <button
                          type="button"
                          className="so-accept-btn"
                          disabled={isBusy}
                          onClick={() =>
                            updateOffer(offer, "accept")
                          }
                        >
                          {busyId === String(offer._id)
                            ? "Updating..."
                            : "✓ Accept"}
                        </button>

                        <button
                          type="button"
                          className="so-reject-btn"
                          disabled={isBusy}
                          onClick={() =>
                            updateOffer(offer, "reject")
                          }
                        >
                          ✕ Reject
                        </button>

                        <button
                          type="button"
                          className="so-counter-btn"
                          disabled={isBusy}
                          onClick={() => {
                            setSelectedOffer(offer);
                            setCounterPrice("");
                            setError("");
                          }}
                        >
                          💰 Counter Offer
                        </button>
                      </div>
                    )}

                    {status === "Accepted" && (
                      <p className="so-action-note">
                        ✓ You accepted this offer.
                      </p>
                    )}

                    {status === "Rejected" && (
                      <p className="so-action-note">
                        This offer was rejected.
                      </p>
                    )}

                    {status === "Countered" && (
                      <p className="so-action-note">
                        Waiting for buyer response.
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* COUNTER OFFER POPUP */}

      {selectedOffer && (
        <div
          className="so-overlay"
          onClick={(event) => {
            if (
              event.target === event.currentTarget &&
              !busyId
            ) {
              setSelectedOffer(null);
            }
          }}
        >
          <div
            className="so-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="so-counter-title"
          >
            <div className="so-modal-icon">💰</div>

            <h2 id="so-counter-title">
              Send Counter Offer
            </h2>

            <p>
              Buyer offered{" "}
              <strong>
                ₹{money(selectedOffer.offerPrice)}
              </strong>
              . Enter the price you want to propose.
            </p>

            <label
              htmlFor="so-counter-price"
              className="so-input-label"
            >
              Your Counter Price (₹)
            </label>

            <input
              id="so-counter-price"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Enter counter price"
              value={counterPrice}
              onChange={(event) =>
                setCounterPrice(event.target.value)
              }
            />

            {error && (
              <p className="so-modal-error">
                {error}
              </p>
            )}

            <div className="so-modal-buttons">
              <button
                type="button"
                className="so-cancel-btn"
                disabled={Boolean(busyId)}
                onClick={() => {
                  setSelectedOffer(null);
                  setCounterPrice("");
                  setError("");
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                className="so-send-btn"
                disabled={Boolean(busyId)}
                onClick={sendCounter}
              >
                {busyId
                  ? "Sending..."
                  : "Send Counter"}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="so-footer">
        © 2026 C-Mart · Campus Marketplace for Students
      </footer>
    </div>
  );
}

// ========================================
// COMPLETE CSS - SAME FILE
// ========================================

const sellerOffersCSS = `
.so-page {
  --primary: #635bdb;
  --primary-dark: #4f46c7;
  --text: #20243a;
  --muted: #747b91;
  --border: #e8eaf4;
  min-height: 100vh;
  background: #f6f7fc;
  color: var(--text);
  font-family: "Inter", "Segoe UI", Arial, sans-serif;
}

.so-page *,
.so-page *::before,
.so-page *::after {
  box-sizing: border-box;
}

.so-page button {
  font-family: inherit;
  transition: all 0.25s ease;
}

.so-page button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.so-page button:focus-visible,
.so-page input:focus-visible {
  outline: 3px solid #b9b2ff;
  outline-offset: 3px;
}

/* NAVBAR */

.so-navbar {
  background: #ffffff;
  padding: 18px 5%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  border-bottom: 1px solid var(--border);
  box-shadow: 0 3px 18px rgba(30, 40, 90, 0.05);
}

.so-logo {
  background: none;
  border: none;
  color: var(--primary);
  font-size: 25px;
  font-weight: 800;
  cursor: pointer;
}

.so-nav-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.so-nav-link {
  background: transparent;
  border: none;
  color: #596179;
  font-weight: 700;
  cursor: pointer;
  padding: 10px;
}

.so-nav-link:hover {
  color: var(--primary);
}

.so-dashboard-btn {
  padding: 12px 18px;
  background: #f0eeff;
  color: var(--primary);
  border: 1px solid #dedaff;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.so-dashboard-btn:hover {
  background: var(--primary);
  color: #ffffff;
}

/* MAIN CONTAINER */

.so-container {
  width: min(1200px, 92%);
  margin: 0 auto;
  padding: 38px 0 75px;
}

/* HEADING */

.so-heading-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 30px;
}

.so-label {
  color: var(--primary);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 1.8px;
  margin: 0 0 12px;
}

.so-heading-section h1 {
  font-size: clamp(27px, 3vw, 37px);
  font-weight: 800;
  margin: 0 0 12px;
  letter-spacing: -0.8px;
}

.so-subtitle {
  color: var(--muted);
  font-size: 15px;
  line-height: 1.7;
  margin: 0;
}

.so-refresh-btn {
  padding: 13px 20px;
  background: #ffffff;
  color: var(--primary);
  border: 1px solid #d8d4ff;
  border-radius: 11px;
  font-weight: 700;
  cursor: pointer;
}

.so-refresh-btn:hover:not(:disabled) {
  background: #f0eeff;
}

/* STATISTICS */

.so-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
  margin-bottom: 30px;
}

.so-stat-card {
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: 17px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: 0 5px 20px rgba(30, 40, 90, 0.04);
  transition: transform 0.25s, box-shadow 0.25s;
}

.so-stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(49, 43, 116, 0.1);
}

.so-stat-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  color: var(--muted);
  font-size: 14px;
  font-weight: 600;
}

.so-stat-icon {
  font-size: 24px;
}

.so-stat-card strong {
  color: var(--primary);
  font-size: 33px;
  font-weight: 800;
}

.so-stat-accepted strong {
  color: #16a34a;
}

.so-stat-pending strong {
  color: #d97706;
}

.so-stat-countered strong {
  color: #7c3aed;
}

/* MESSAGES */

.so-success,
.so-error {
  padding: 16px 20px;
  margin-bottom: 22px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 14px;
  font-weight: 600;
}

.so-success {
  background: #e9f9f0;
  color: #187647;
  border: 1px solid #b9ebcd;
}

.so-error {
  background: #fff0f1;
  color: #b42334;
  border: 1px solid #ffcbd0;
}

.so-success button,
.so-error button {
  border: none;
  background: transparent;
  color: inherit;
  font-size: 22px;
  cursor: pointer;
}

/* FILTER SECTION */

.so-filter-section {
  margin-bottom: 26px;
}

.so-filter-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.so-filter-heading h2 {
  font-size: 23px;
  font-weight: 800;
  margin: 0 0 8px;
}

.so-filter-heading p {
  color: var(--muted);
  margin: 0;
  font-size: 14px;
}

.so-offer-count {
  background: #eeecff;
  color: var(--primary);
  border-radius: 30px;
  padding: 9px 15px;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.so-filter-row {
  display: flex;
  gap: 11px;
  flex-wrap: wrap;
}

.so-filter-btn {
  padding: 11px 19px;
  background: #ffffff;
  color: #5e657c;
  border: 1px solid var(--border);
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.so-filter-btn:hover {
  background: #f0eeff;
  color: var(--primary);
}

.so-filter-btn.active {
  background: var(--primary);
  border-color: var(--primary);
  color: #ffffff;
}

.so-filter-count {
  margin-left: 7px;
  font-size: 11px;
  opacity: 0.85;
}

/* OFFERS LIST */

.so-offers-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.so-offer-card {
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: 19px;
  padding: 25px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 26px;
  box-shadow: 0 5px 20px rgba(30, 40, 90, 0.045);
  transition: box-shadow 0.25s, border-color 0.25s;
}

.so-offer-card:hover {
  border-color: #d8d4ff;
  box-shadow: 0 13px 32px rgba(49, 43, 116, 0.1);
}

.so-product-section {
  display: flex;
  align-items: center;
  gap: 22px;
  flex: 1;
  min-width: 0;
}

.so-image-box {
  width: 120px;
  height: 120px;
  flex-shrink: 0;
  border-radius: 13px;
  background: #f2f0ff;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.so-image-box img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 8px;
}

.so-image-box span {
  font-size: 48px;
}

.so-product-info {
  min-width: 0;
}

.so-product-label {
  color: var(--primary);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.2px;
}

.so-product-info h2 {
  font-size: 21px;
  font-weight: 800;
  margin: 9px 0 12px;
  overflow-wrap: anywhere;
}

.so-muted {
  color: var(--muted);
  font-size: 14px;
  margin: 8px 0;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.so-price-box {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: #f3f1ff;
  border: 1px solid #e6e2ff;
  padding: 13px 16px;
  border-radius: 11px;
  margin-top: 14px;
  width: fit-content;
  min-width: 170px;
}

.so-price-box span {
  color: #77729a;
  font-size: 12px;
  font-weight: 600;
}

.so-price-box strong {
  color: var(--primary);
  font-size: 23px;
  font-weight: 800;
}

.so-counter-price {
  color: #a16207;
  font-size: 15px;
  font-weight: 700;
  margin-top: 12px;
}

.so-date {
  color: #9299ab;
  font-size: 12px;
  margin-top: 14px;
}

/* ACTIONS */

.so-action-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 15px;
  flex: 0 1 320px;
}

.so-status {
  display: inline-flex;
  align-items: center;
  border-radius: 25px;
  padding: 9px 16px;
  font-size: 12px;
  font-weight: 800;
}

.so-status-pending {
  background: #dbeafe;
  color: #1d4ed8;
}

.so-status-accepted {
  background: #dcfce7;
  color: #166534;
}

.so-status-rejected {
  background: #fee2e2;
  color: #991b1b;
}

.so-status-countered {
  background: #fef3c7;
  color: #92400e;
}

.so-action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.so-action-buttons button {
  border: none;
  border-radius: 10px;
  padding: 12px 16px;
  color: #ffffff;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
}

.so-accept-btn {
  background: #16a34a;
}

.so-reject-btn {
  background: #dc2626;
}

.so-counter-btn {
  background: var(--primary);
}

.so-action-buttons button:hover:not(:disabled) {
  filter: brightness(0.9);
  transform: translateY(-2px);
}

.so-action-note {
  color: var(--muted);
  font-size: 13px;
  line-height: 1.6;
}

/* EMPTY STATE */

.so-empty {
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 65px 25px;
  text-align: center;
  box-shadow: 0 5px 20px rgba(30, 40, 90, 0.04);
}

.so-empty-icon {
  font-size: 50px;
  margin-bottom: 12px;
}

.so-empty h2 {
  color: var(--text);
  font-size: 24px;
  margin: 15px 0 10px;
}

.so-empty p {
  color: var(--muted);
  line-height: 1.7;
  margin-bottom: 23px;
}

.so-primary-btn {
  background: var(--primary);
  color: #ffffff;
  border: none;
  border-radius: 10px;
  padding: 13px 22px;
  font-weight: 700;
  cursor: pointer;
}

.so-primary-btn:hover {
  background: var(--primary-dark);
}

/* MODAL */

.so-overlay {
  position: fixed;
  inset: 0;
  background: rgba(20, 20, 45, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 18px;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.so-modal {
  background: #ffffff;
  width: 100%;
  max-width: 440px;
  border-radius: 22px;
  padding: 32px;
  text-align: center;
  box-shadow: 0 20px 65px rgba(15, 20, 55, 0.25);
}

.so-modal-icon {
  font-size: 43px;
}

.so-modal h2 {
  color: var(--text);
  font-size: 24px;
  margin: 14px 0;
}

.so-modal > p {
  color: var(--muted);
  line-height: 1.7;
  font-size: 14px;
}

.so-input-label {
  display: block;
  text-align: left;
  color: var(--text);
  font-weight: 700;
  font-size: 13px;
  margin-top: 20px;
}

.so-modal input {
  width: 100%;
  padding: 15px;
  margin-top: 9px;
  border: 1px solid #d6d9e7;
  border-radius: 11px;
  font-size: 16px;
  outline: none;
}

.so-modal input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(99, 91, 219, 0.12);
}

.so-modal-error {
  color: #dc2626 !important;
  font-weight: 600;
}

.so-modal-buttons {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 23px;
}

.so-modal-buttons button {
  flex: 1;
  padding: 13px 17px;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
}

.so-cancel-btn {
  background: #ffffff;
  border: 1px solid #d6d9e7;
  color: #475569;
}

.so-send-btn {
  background: var(--primary);
  color: #ffffff;
  border: 1px solid var(--primary);
}

.so-send-btn:hover:not(:disabled) {
  background: var(--primary-dark);
}

/* FOOTER */

.so-footer {
  padding: 24px;
  text-align: center;
  color: #9299ab;
  font-size: 13px;
  border-top: 1px solid var(--border);
}

/* TABLET */

@media (max-width: 1024px) {
  .so-stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .so-offer-card {
    flex-direction: column;
    align-items: stretch;
  }

  .so-action-section {
    flex: auto;
    border-top: 1px solid var(--border);
    padding-top: 20px;
  }
}

/* MOBILE */

@media (max-width: 600px) {
  .so-navbar {
    padding: 16px 5%;
  }

  .so-logo {
    font-size: 20px;
  }

  .so-nav-link {
    display: none;
  }

  .so-dashboard-btn {
    padding: 10px 12px;
    font-size: 12px;
  }

  .so-container {
    padding-top: 25px;
  }

  .so-heading-section h1 {
    font-size: 27px;
  }

  .so-stats-grid {
    gap: 12px;
  }

  .so-stat-card {
    padding: 18px;
  }

  .so-stat-card strong {
    font-size: 27px;
  }

  .so-filter-heading {
    align-items: flex-start;
  }

  .so-offer-card {
    padding: 18px;
  }

  .so-product-section {
    flex-direction: column;
    align-items: flex-start;
  }

  .so-image-box {
    width: 100%;
    height: 190px;
  }

  .so-action-buttons {
    width: 100%;
  }

  .so-action-buttons button {
    flex: 1;
  }

  .so-modal {
    padding: 25px 20px;
  }
}

@media (max-width: 360px) {
  .so-modal-buttons {
    flex-direction: column;
  }

  .so-filter-btn {
    padding: 10px 13px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .so-page *,
  .so-page *::before,
  .so-page *::after {
    transition-duration: 0.01ms !important;
  }
}
`;

export default SellerOffers;
