
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000/api";

const money = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });

const getImageUrl = (image) => {
  if (!image) return "";

  if (typeof image === "string") {
    if (image.startsWith("http")) return image;

    return `http://localhost:5000/${image.replace(/^\/+/, "")}`;
  }

  return image.url || image.secure_url || image.imageUrl || "";
};

const colors = {
  Pending: { bg: "#dbeafe", text: "#1d4ed8" },
  Accepted: { bg: "#dcfce7", text: "#166534" },
  Rejected: { bg: "#fee2e2", text: "#991b1b" },
  Countered: { bg: "#fef3c7", text: "#92400e" },
};

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

  const apiRequest = useCallback(async (path, options = {}) => {
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

    if (!response.ok) {
      throw new Error(
        data.message || `Request failed (${response.status})`
      );
    }

    return data;
  }, []);

  const loadOffers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest("/bargaining/seller");

      if (!Array.isArray(data.offers)) {
        throw new Error("Invalid offers response from server.");
      }

      setOffers(data.offers);
    } catch (err) {
      setError(err.message || "Unable to load seller offers.");
    } finally {
      setLoading(false);
    }
  }, [apiRequest]);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  const updateOffer = async (offer, action, body = {}) => {
    if (busyId) return;

    setBusyId(offer._id);
    setError("");
    setSuccess("");

    try {
      await apiRequest(`/bargaining/${offer._id}/${action}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });

      const messages = {
        accept: "Offer accepted successfully!",
        reject: "Offer rejected successfully.",
        counter: "Counter offer sent successfully!",
      };

      setSuccess(messages[action] || "Offer updated successfully.");

      setSelectedOffer(null);
      setCounterPrice("");

      await loadOffers();
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

  const pendingCount = offers.filter(
    (offer) => (offer.status || "Pending") === "Pending"
  ).length;

  const acceptedCount = offers.filter(
    (offer) => offer.status === "Accepted"
  ).length;

  const counteredCount = offers.filter(
    (offer) => offer.status === "Countered"
  ).length;

  const filteredOffers =
    filter === "All"
      ? offers
      : offers.filter(
          (offer) => (offer.status || "Pending") === filter
        );

  const buttonStyle = (background) => ({
    border: "none",
    borderRadius: 9,
    padding: "11px 15px",
    background,
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  });

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h2 style={styles.logo}>🛒 C-MART</h2>

        <button
          type="button"
          onClick={() => navigate("/")}
          style={buttonStyle("#172033")}
        >
          ← Dashboard
        </button>
      </header>

      <main style={styles.container}>
        <div style={styles.headingSection}>
          <div>
            <p style={styles.label}>SELLER DASHBOARD</p>
            <h1 style={styles.heading}>Incoming Bargain Offers</h1>
            <p style={styles.subtitle}>
              Manage offers received for your uploaded products.
            </p>
          </div>

          <button
            type="button"
            onClick={loadOffers}
            disabled={loading || Boolean(busyId)}
            style={styles.refreshButton}
          >
            {loading ? "Loading..." : "↻ Refresh Offers"}
          </button>
        </div>

        <div style={styles.statsGrid}>
          {[
            { label: "Total Offers", value: offers.length },
            { label: "Pending", value: pendingCount },
            { label: "Accepted", value: acceptedCount },
            { label: "Countered", value: counteredCount },
          ].map((stat) => (
            <div key={stat.label} style={styles.statCard}>
              <span style={styles.statLabel}>{stat.label}</span>
              <strong style={styles.statValue}>{stat.value}</strong>
            </div>
          ))}
        </div>

        {success && (
          <div style={styles.successMessage}>
            ✓ {success}
            <button
              type="button"
              onClick={() => setSuccess("")}
              style={styles.closeButton}
              aria-label="Dismiss success message"
            >
              ×
            </button>
          </div>
        )}

        {error && (
          <div style={styles.errorMessage}>
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              style={styles.closeButton}
              aria-label="Dismiss error message"
            >
              ×
            </button>
          </div>
        )}

        <div style={styles.filterRow}>
          {["All", "Pending", "Accepted", "Rejected", "Countered"].map(
            (item) => (
              <button
                type="button"
                key={item}
                onClick={() => setFilter(item)}
                style={{
                  ...styles.filterButton,
                  ...(filter === item ? styles.activeFilter : {}),
                }}
              >
                {item}
              </button>
            )
          )}
        </div>

        {loading ? (
          <div style={styles.emptyBox}>
            <h3>Loading seller offers...</h3>
            <p>Please wait while we fetch your requests.</p>
          </div>
        ) : filteredOffers.length === 0 ? (
          <div style={styles.emptyBox}>
            <div style={{ fontSize: 50 }}>📭</div>
            <h2>
              {error
                ? "Could not load offers"
                : filter === "All"
                ? "No Offers Yet"
                : `No ${filter} Offers`}
            </h2>
            <p>
              {error
                ? "Please check the error above and try again."
                : "Buyer requests for your products will appear here."}
            </p>

            <button
              type="button"
              onClick={loadOffers}
              style={buttonStyle("#2563eb")}
            >
              Check Again
            </button>
          </div>
        ) : (
          <div style={styles.offersList}>
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
                product.name || product.productName || "Product";

              const image = getImageUrl(
                Array.isArray(product.images)
                  ? product.images[0]
                  : product.image
              );

              const status = offer.status || "Pending";
              const statusColor = colors[status] || colors.Pending;
              const isBusy = Boolean(busyId);

              return (
                <article key={offer._id} style={styles.offerCard}>
                  <div style={styles.productSection}>
                    {image ? (
                      <img
                        src={image}
                        alt={productName}
                        style={styles.productImage}
                      />
                    ) : (
                      <div style={styles.imageFallback}>📦</div>
                    )}

                    <div style={styles.productInfo}>
                      <h2 style={styles.productName}>
                        {productName}
                      </h2>

                      <p style={styles.muted}>
                        Buyer: {buyer.fullName || "C-Mart User"}
                      </p>

                      <p style={styles.muted}>
                        Listed Price: ₹{money(product.price)}
                      </p>

                      <div style={styles.offerPrice}>
                        Buyer Offer: ₹{money(offer.offerPrice)}
                      </div>

                      {offer.counterPrice != null && (
                        <div style={styles.counterPrice}>
                          Seller Counter: ₹
                          {money(offer.counterPrice)}
                        </div>
                      )}

                      {offer.createdAt && (
                        <p style={styles.date}>
                          Received:{" "}
                          {new Date(
                            offer.createdAt
                          ).toLocaleString("en-IN")}
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={styles.actionSection}>
                    <span
                      style={{
                        ...styles.status,
                        background: statusColor.bg,
                        color: statusColor.text,
                      }}
                    >
                      {status}
                    </span>

                    {status === "Pending" && (
                      <div style={styles.actionButtons}>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() =>
                            updateOffer(offer, "accept")
                          }
                          style={buttonStyle("#16a34a")}
                        >
                          {busyId === offer._id
                            ? "Updating..."
                            : "✓ Accept"}
                        </button>

                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() =>
                            updateOffer(offer, "reject")
                          }
                          style={buttonStyle("#dc2626")}
                        >
                          ✕ Reject
                        </button>

                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => {
                            setSelectedOffer(offer);
                            setCounterPrice("");
                            setError("");
                          }}
                          style={buttonStyle("#2563eb")}
                        >
                          💰 Counter Offer
                        </button>
                      </div>
                    )}

                    {status === "Accepted" && (
                      <p style={styles.actionNote}>
                        ✓ You accepted this offer.
                      </p>
                    )}

                    {status === "Rejected" && (
                      <p style={styles.actionNote}>
                        This offer was rejected.
                      </p>
                    )}

                    {status === "Countered" && (
                      <p style={styles.actionNote}>
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

      {selectedOffer && (
        <div
          style={styles.overlay}
          onClick={(event) => {
            if (event.target === event.currentTarget && !busyId) {
              setSelectedOffer(null);
            }
          }}
        >
          <div
            style={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="counter-title"
          >
            <div style={{ fontSize: 42 }}>💰</div>

            <h2 id="counter-title">Send Counter Offer</h2>

            <p style={styles.muted}>
              Buyer offered ₹{money(selectedOffer.offerPrice)}.
              Enter the price you want to propose.
            </p>

            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Enter counter price"
              value={counterPrice}
              onChange={(event) =>
                setCounterPrice(event.target.value)
              }
              style={styles.input}
            />

            <div style={styles.modalButtons}>
              <button
                type="button"
                disabled={Boolean(busyId)}
                onClick={() => {
                  setSelectedOffer(null);
                  setCounterPrice("");
                  setError("");
                }}
                style={styles.cancelButton}
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={Boolean(busyId)}
                onClick={sendCounter}
                style={buttonStyle("#2563eb")}
              >
                {busyId ? "Sending..." : "Send Counter"}
              </button>
            </div>

            {error && (
              <p style={{ color: "#dc2626" }}>{error}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f7fb",
    color: "#172033",
    fontFamily: "Arial, sans-serif",
  },

  header: {
    background: "#fff",
    padding: "18px 6%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
  },

  logo: {
    color: "#2563eb",
    margin: 0,
    fontSize: 25,
  },

  container: {
    maxWidth: 1150,
    margin: "0 auto",
    padding: "35px 20px",
  },

  headingSection: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 18,
    marginBottom: 25,
  },

  label: {
    fontSize: 12,
    fontWeight: 800,
    color: "#2563eb",
    letterSpacing: 1.5,
  },

  heading: {
    fontSize: 32,
    margin: "8px 0",
  },

  subtitle: {
    color: "#64748b",
    lineHeight: 1.6,
  },

  refreshButton: {
    border: "1px solid #cbd5e1",
    background: "#fff",
    padding: "12px 18px",
    borderRadius: 9,
    cursor: "pointer",
    fontWeight: 600,
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 15,
    marginBottom: 25,
  },

  statCard: {
    background: "#fff",
    padding: 22,
    borderRadius: 14,
    boxShadow: "0 5px 18px rgba(0,0,0,0.04)",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  statLabel: {
    color: "#64748b",
    fontSize: 14,
  },

  statValue: {
    fontSize: 29,
    color: "#172033",
  },

  filterRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 22,
  },

  filterButton: {
    background: "#fff",
    border: "1px solid #cbd5e1",
    color: "#475569",
    padding: "10px 16px",
    borderRadius: 9,
    cursor: "pointer",
    fontWeight: 600,
  },

  activeFilter: {
    background: "#2563eb",
    color: "#fff",
    borderColor: "#2563eb",
  },

  offersList: {
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },

  offerCard: {
    background: "#fff",
    borderRadius: 16,
    padding: 22,
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 25,
    boxShadow: "0 6px 22px rgba(0,0,0,0.05)",
  },

  productSection: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 20,
    flex: "1 1 450px",
  },

  productImage: {
    width: 110,
    height: 110,
    objectFit: "cover",
    borderRadius: 12,
    background: "#eef4ff",
  },

  imageFallback: {
    width: 110,
    height: 110,
    borderRadius: 12,
    background: "#eef4ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 45,
  },

  productInfo: {
    flex: "1 1 200px",
    minWidth: 0,
  },

  productName: {
    margin: "0 0 10px",
    fontSize: 21,
  },

  muted: {
    color: "#64748b",
    margin: "7px 0",
    overflowWrap: "anywhere",
  },

  offerPrice: {
    fontSize: 19,
    color: "#2563eb",
    fontWeight: 800,
    marginTop: 12,
  },

  counterPrice: {
    fontSize: 16,
    color: "#92400e",
    fontWeight: 700,
    marginTop: 8,
  },

  date: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 12,
  },

  actionSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 14,
    flex: "0 1 300px",
  },

  status: {
    borderRadius: 20,
    padding: "8px 15px",
    fontSize: 13,
    fontWeight: 800,
  },

  actionButtons: {
    display: "flex",
    flexWrap: "wrap",
    gap: 9,
  },

  actionNote: {
    color: "#64748b",
    fontSize: 13,
  },

  emptyBox: {
    background: "#fff",
    borderRadius: 16,
    padding: "65px 20px",
    textAlign: "center",
    boxShadow: "0 5px 20px rgba(0,0,0,0.04)",
  },

  successMessage: {
    background: "#dcfce7",
    color: "#166534",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
  },

  errorMessage: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
  },

  closeButton: {
    border: 0,
    background: "transparent",
    color: "inherit",
    fontSize: 20,
    cursor: "pointer",
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    zIndex: 1000,
  },

  modal: {
    background: "#fff",
    borderRadius: 18,
    padding: 28,
    width: "100%",
    maxWidth: 430,
    boxSizing: "border-box",
    textAlign: "center",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: 14,
    borderRadius: 9,
    border: "1px solid #cbd5e1",
    fontSize: 16,
    marginTop: 15,
  },

  modalButtons: {
    display: "flex",
    justifyContent: "center",
    gap: 12,
    marginTop: 22,
  },

  cancelButton: {
    background: "#fff",
    border: "1px solid #cbd5e1",
    borderRadius: 9,
    padding: "11px 18px",
    cursor: "pointer",
  },
};

export default SellerOffers;
