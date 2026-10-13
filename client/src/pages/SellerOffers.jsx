import { useCallback, useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api";

function SellerOffers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [counterPrice, setCounterPrice] = useState("");

  const apiRequest = async (path, options = {}) => {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("Please log in again to view seller offers.");
    }

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    const data = await response.json().catch(() => ({}));

    console.log(`[C-Mart API] ${path}:`, response.status, data);

    if (!response.ok) {
      throw new Error(
        data.message || `Request failed (${response.status})`
      );
    }

    return data;
  };

  const loadOffers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest("/bargaining/seller");

      if (!Array.isArray(data.offers)) {
        console.error("Unexpected seller offers response:", data);
        throw new Error("Unexpected response from the server.");
      }

      console.log("Seller offers received:", data.offers.length);

      setOffers(data.offers);
    } catch (err) {
      console.error("Loading seller offers failed:", err);
      setError(err.message || "Unable to load offers.");
      setOffers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  const updateOffer = async (offer, action, body = {}) => {
    setBusyId(offer._id);
    setError("");

    try {
      await apiRequest(`/bargaining/${offer._id}/${action}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });

      setSelectedOffer(null);
      setCounterPrice("");

      await loadOffers();
    } catch (err) {
      console.error(`Offer ${action} failed:`, err);
      setError(err.message || "Unable to update offer.");
    } finally {
      setBusyId("");
    }
  };

  const sendCounter = async () => {
    const price = Number(counterPrice);

    if (!Number.isFinite(price) || price <= 0) {
      setError("Please enter a valid counter price.");
      return;
    }

    if (!selectedOffer) return;

    await updateOffer(selectedOffer, "counter", {
      counterPrice: price,
    });
  };

  const money = (value) =>
    Number(value || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    });

  const statusColors = {
    Pending: ["#dbeafe", "#1d4ed8"],
    Accepted: ["#dcfce7", "#166534"],
    Rejected: ["#fee2e2", "#991b1b"],
    Countered: ["#fef3c7", "#92400e"],
  };

  const getStatusStyle = (status) => {
    const [background, color] =
      statusColors[status] || statusColors.Pending;

    return {
      background,
      color,
      padding: "7px 13px",
      borderRadius: 20,
      fontSize: 13,
      fontWeight: 700,
      whiteSpace: "nowrap",
    };
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.logo}>🛒 C-Mart</div>
        <div style={styles.headerTitle}>Seller Offers</div>
      </header>

      <main style={styles.container}>
        <div style={styles.topSection}>
          <div>
            <p style={styles.smallTitle}>SELLER DASHBOARD</p>
            <h1 style={styles.heading}>Incoming Offers</h1>
            <p style={styles.subtitle}>
              Review buyer offers and accept, reject, or negotiate.
            </p>
          </div>

          <div style={styles.offerCount}>
            🤝 {offers.length} Offers
          </div>
        </div>

        <div style={styles.toolbar}>
          <button
            type="button"
            style={styles.refreshButton}
            onClick={loadOffers}
            disabled={loading || Boolean(busyId)}
          >
            {loading ? "Loading..." : "↻ Refresh Offers"}
          </button>

          <button
            type="button"
            style={styles.backButton}
            onClick={() => {
              window.location.href = "/dashboard";
            }}
          >
            ← Dashboard
          </button>
        </div>

        {error && (
          <div style={styles.error}>
            <strong>Unable to load/process offers</strong>
            <p style={{ margin: "6px 0 0" }}>{error}</p>
            <button
              type="button"
              style={styles.retryButton}
              onClick={loadOffers}
            >
              Try Again
            </button>
          </div>
        )}

        {loading ? (
          <div style={styles.emptyBox}>Loading seller offers...</div>
        ) : offers.length === 0 ? (
          <div style={styles.emptyBox}>
            <div style={styles.emptyIcon}>📭</div>
            <h2>No Offers Yet</h2>
            <p>
              If a buyer has submitted an offer, check that you are
              logged in with the account that owns the product.
            </p>
            <button
              type="button"
              style={styles.refreshButton}
              onClick={loadOffers}
            >
              Check Again
            </button>
          </div>
        ) : (
          <div style={styles.offersContainer}>
            {offers.map((offer) => {
              const product =
                offer.productId && typeof offer.productId === "object"
                  ? offer.productId
                  : {};

              const buyer =
                offer.buyerId && typeof offer.buyerId === "object"
                  ? offer.buyerId
                  : {};

              const productName =
                product.name || product.productName || "Product";

              const firstImage = Array.isArray(product.images)
                ? product.images[0]
                : null;

              const imageUrl =
                typeof firstImage === "string"
                  ? firstImage
                  : firstImage?.url || firstImage?.secure_url || "";

              return (
                <div key={offer._id} style={styles.offerCard}>
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={productName}
                      style={styles.productImage}
                    />
                  ) : (
                    <div style={styles.productIcon}>📦</div>
                  )}

                  <div style={styles.offerDetails}>
                    <h2 style={styles.productName}>{productName}</h2>

                    <p style={styles.muted}>
                      Buyer: {buyer.fullName || "C-Mart User"}
                    </p>

                    {buyer.email && (
                      <p style={styles.muted}>{buyer.email}</p>
                    )}

                    <p style={styles.originalPrice}>
                      Listed Price: ₹{money(product.price)}
                    </p>

                    <div style={styles.priceBox}>
                      <span>Buyer Offer</span>
                      <strong>₹{money(offer.offerPrice)}</strong>
                    </div>

                    {offer.counterPrice != null && (
                      <div style={styles.counterBox}>
                        <span>Counter Price</span>
                        <strong>₹{money(offer.counterPrice)}</strong>
                      </div>
                    )}

                    <p style={styles.dateText}>
                      {offer.createdAt
                        ? new Date(offer.createdAt).toLocaleString("en-IN")
                        : ""}
                    </p>
                  </div>

                  <div style={styles.actionSection}>
                    <span style={getStatusStyle(offer.status)}>
                      {offer.status || "Pending"}
                    </span>

                    {offer.status === "Pending" && (
                      <div style={styles.buttons}>
                        <button
                          type="button"
                          disabled={busyId === offer._id}
                          onClick={() => updateOffer(offer, "accept")}
                          style={styles.acceptButton}
                        >
                          {busyId === offer._id
                            ? "Please wait..."
                            : "✓ Accept"}
                        </button>

                        <button
                          type="button"
                          disabled={busyId === offer._id}
                          onClick={() => updateOffer(offer, "reject")}
                          style={styles.rejectButton}
                        >
                          ✕ Reject
                        </button>

                        <button
                          type="button"
                          disabled={busyId === offer._id}
                          onClick={() => {
                            setError("");
                            setSelectedOffer(offer);
                            setCounterPrice("");
                          }}
                          style={styles.counterButton}
                        >
                          💰 Counter
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {selectedOffer && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalIcon}>💰</div>
            <h2>Send Counter Offer</h2>

            <p style={styles.modalText}>
              Buyer offered ₹{money(selectedOffer.offerPrice)}.
              Enter your counter price.
            </p>

            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Enter counter price"
              value={counterPrice}
              onChange={(event) => setCounterPrice(event.target.value)}
              style={styles.input}
            />

            <div style={styles.modalButtons}>
              <button
                type="button"
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
                disabled={busyId === selectedOffer._id}
                onClick={sendCounter}
                style={styles.counterButton}
              >
                {busyId === selectedOffer._id
                  ? "Sending..."
                  : "Send Counter"}
              </button>
            </div>
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
    fontFamily: "Arial, sans-serif",
    color: "#172033",
  },
  header: {
    minHeight: 70,
    background: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "12px 6%",
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
  },
  logo: { fontSize: 25, fontWeight: 800, color: "#2563eb" },
  headerTitle: { color: "#64748b", fontWeight: 600 },
  container: { maxWidth: 1100, margin: "0 auto", padding: "35px 20px" },
  topSection: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 18,
    marginBottom: 20,
  },
  smallTitle: {
    color: "#2563eb",
    fontWeight: 800,
    letterSpacing: 1.5,
    fontSize: 13,
  },
  heading: { fontSize: 34, margin: "8px 0" },
  subtitle: { color: "#64748b", lineHeight: 1.5 },
  offerCount: {
    background: "#fff",
    padding: "15px 20px",
    borderRadius: 12,
    fontWeight: 700,
    boxShadow: "0 5px 20px rgba(0,0,0,0.06)",
  },
  toolbar: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  refreshButton: {
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#172033",
    padding: "10px 15px",
    borderRadius: 8,
    cursor: "pointer",
  },
  backButton: {
    border: 0,
    background: "#172033",
    color: "#fff",
    padding: "10px 15px",
    borderRadius: 8,
    cursor: "pointer",
  },
  offersContainer: { display: "flex", flexDirection: "column", gap: 18 },
  offerCard: {
    background: "#fff",
    borderRadius: 16,
    padding: 22,
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 20,
    boxShadow: "0 8px 25px rgba(0,0,0,0.05)",
  },
  productImage: {
    width: 85,
    height: 85,
    objectFit: "cover",
    borderRadius: 12,
    background: "#eef4ff",
  },
  productIcon: {
    width: 85,
    height: 85,
    borderRadius: 12,
    background: "#eef4ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 40,
  },
  offerDetails: { flex: "1 1 250px", minWidth: 0 },
  productName: { margin: "0 0 10px", fontSize: 21 },
  muted: {
    color: "#64748b",
    margin: "5px 0",
    overflowWrap: "anywhere",
  },
  originalPrice: { color: "#64748b", margin: "12px 0" },
  priceBox: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    alignItems: "center",
  },
  counterBox: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 10,
    color: "#92400e",
  },
  dateText: { color: "#94a3b8", fontSize: 12, marginTop: 12 },
  actionSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 14,
  },
  buttons: { display: "flex", flexWrap: "wrap", gap: 8 },
  acceptButton: {
    border: 0,
    background: "#16a34a",
    color: "#fff",
    padding: "10px 12px",
    borderRadius: 8,
    fontWeight: 700,
    cursor: "pointer",
  },
  rejectButton: {
    border: 0,
    background: "#dc2626",
    color: "#fff",
    padding: "10px 12px",
    borderRadius: 8,
    fontWeight: 700,
    cursor: "pointer",
  },
  counterButton: {
    border: 0,
    background: "#2563eb",
    color: "#fff",
    padding: "10px 12px",
    borderRadius: 8,
    fontWeight: 700,
    cursor: "pointer",
  },
  emptyBox: {
    background: "#fff",
    borderRadius: 18,
    padding: "60px 20px",
    textAlign: "center",
    boxShadow: "0 8px 25px rgba(0,0,0,0.05)",
  },
  emptyIcon: { fontSize: 55 },
  error: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: 14,
    borderRadius: 10,
    marginBottom: 20,
  },
  retryButton: {
    marginTop: 12,
    padding: "8px 12px",
    border: "1px solid #fecaca",
    background: "#fff",
    color: "#991b1b",
    borderRadius: 8,
    cursor: "pointer",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    padding: 15,
  },
  modal: {
    width: "100%",
    maxWidth: 420,
    boxSizing: "border-box",
    background: "#fff",
    borderRadius: 18,
    padding: 28,
    textAlign: "center",
  },
  modalIcon: { fontSize: 45 },
  modalText: { color: "#64748b", lineHeight: 1.6 },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: 14,
    border: "1px solid #cbd5e1",
    borderRadius: 9,
    fontSize: 16,
    marginTop: 12,
  },
  modalButtons: { display: "flex", gap: 10, marginTop: 20 },
  cancelButton: {
    flex: 1,
    padding: 12,
    border: "1px solid #cbd5e1",
    background: "#fff",
    borderRadius: 9,
    cursor: "pointer",
  },
};

export default SellerOffers;
