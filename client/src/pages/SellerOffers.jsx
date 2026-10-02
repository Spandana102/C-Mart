import { useEffect, useState } from "react";

function SellerOffers() {
  const [offers, setOffers] = useState([]);

  const [selectedOffer, setSelectedOffer] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [counterPrice, setCounterPrice] = useState("");

  // Load offers saved by the buyer
  useEffect(() => {
    const savedOffers =
      JSON.parse(localStorage.getItem("cmart_offers")) || [];

    setOffers(savedOffers);
  }, []);

  // Accept offer
  const acceptOffer = (id) => {
    const updatedOffers = offers.map((offer) =>
      offer.id === id
        ? { ...offer, status: "Accepted" }
        : offer
    );

    setOffers(updatedOffers);

    localStorage.setItem(
      "cmart_offers",
      JSON.stringify(updatedOffers)
    );
  };

  // Reject offer
  const rejectOffer = (id) => {
    const updatedOffers = offers.map((offer) =>
      offer.id === id
        ? { ...offer, status: "Rejected" }
        : offer
    );

    setOffers(updatedOffers);

    localStorage.setItem(
      "cmart_offers",
      JSON.stringify(updatedOffers)
    );
  };

  // Open counter offer modal
  const openCounter = (offer) => {
    setSelectedOffer(offer);
    setCounterPrice("");
    setShowModal(true);
  };

  // Send counter offer
  const sendCounter = () => {
    if (!counterPrice || Number(counterPrice) <= 0) {
      alert("Please enter a valid counter price.");
      return;
    }

    const updatedOffers = offers.map((offer) =>
      offer.id === selectedOffer.id
        ? {
            ...offer,
            status: "Countered",
            counterPrice: Number(counterPrice),
          }
        : offer
    );

    setOffers(updatedOffers);

    localStorage.setItem(
      "cmart_offers",
      JSON.stringify(updatedOffers)
    );

    setShowModal(false);
    setCounterPrice("");
  };

  // Clear all offers
  const clearOffers = () => {
    const confirmClear = window.confirm(
      "Are you sure you want to remove all offers?"
    );

    if (!confirmClear) return;

    localStorage.removeItem("cmart_offers");
    setOffers([]);
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logo}>🛒 C-Mart</div>

        <div style={styles.headerTitle}>
          Seller Offers
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.container}>
        <div style={styles.topSection}>
          <div>
            <p style={styles.smallTitle}>
              SELLER DASHBOARD
            </p>

            <h1 style={styles.heading}>
              Incoming Offers
            </h1>

            <p style={styles.subtitle}>
              Review buyer offers and decide whether to
              accept, reject, or negotiate.
            </p>
          </div>

          <div style={styles.offerCount}>
            🤝 {offers.length} Offers
          </div>
        </div>

        {/* Offers */}
        {offers.length === 0 ? (
          <div style={styles.emptyBox}>
            <div style={styles.emptyIcon}>📭</div>

            <h2>No Offers Yet</h2>

            <p>
              When a buyer sends you an offer, it will
              appear here.
            </p>
          </div>
        ) : (
          <>
            <div style={styles.offersContainer}>
              {offers.map((offer) => (
                <div
                  key={offer.id}
                  style={styles.offerCard}
                >
                  {/* Product Icon */}
                  <div style={styles.productIcon}>
                    {offer.productName.includes("Laptop")
                      ? "💻"
                      : "📚"}
                  </div>

                  {/* Offer Details */}
                  <div style={styles.offerDetails}>
                    <h2 style={styles.productName}>
                      {offer.productName}
                    </h2>

                    <p style={styles.originalPrice}>
                      Original Price: ₹
                      {Number(
                        offer.originalPrice
                      ).toLocaleString("en-IN")}
                    </p>

                    <div style={styles.offerPriceBox}>
                      <span>Buyer Offer</span>

                      <strong>
                        ₹
                        {Number(
                          offer.offerPrice
                        ).toLocaleString("en-IN")}
                      </strong>
                    </div>

                    {/* Counter Price */}
                    {offer.counterPrice && (
                      <div style={styles.counterBox}>
                        <span>
                          Your Counter Offer
                        </span>

                        <strong>
                          ₹
                          {Number(
                            offer.counterPrice
                          ).toLocaleString("en-IN")}
                        </strong>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={styles.actionSection}>
                    <span
                      style={{
                        ...styles.status,
                        background:
                          offer.status === "Accepted"
                            ? "#dcfce7"
                            : offer.status === "Rejected"
                            ? "#fee2e2"
                            : offer.status === "Countered"
                            ? "#fef3c7"
                            : "#dbeafe",

                        color:
                          offer.status === "Accepted"
                            ? "#166534"
                            : offer.status === "Rejected"
                            ? "#991b1b"
                            : offer.status === "Countered"
                            ? "#92400e"
                            : "#1d4ed8",
                      }}
                    >
                      {offer.status}
                    </span>

                    {offer.status === "Pending" && (
                      <div style={styles.buttons}>
                        <button
                          onClick={() =>
                            acceptOffer(offer.id)
                          }
                          style={styles.acceptButton}
                        >
                          ✓ Accept
                        </button>

                        <button
                          onClick={() =>
                            rejectOffer(offer.id)
                          }
                          style={styles.rejectButton}
                        >
                          ✕ Reject
                        </button>

                        <button
                          onClick={() =>
                            openCounter(offer)
                          }
                          style={styles.counterButton}
                        >
                          💰 Counter
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Clear Offers */}
            <button
              onClick={clearOffers}
              style={styles.clearButton}
            >
              🗑 Clear All Offers
            </button>
          </>
        )}
      </main>

      {/* Counter Offer Modal */}
      {showModal && selectedOffer && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalIcon}>💰</div>

            <h2>Send Counter Offer</h2>

            <p style={styles.modalText}>
              Buyer offered ₹
              {Number(
                selectedOffer.offerPrice
              ).toLocaleString("en-IN")}
              .
              <br />
              Enter the price you want to offer.
            </p>

            <div style={styles.inputWrapper}>
              <span style={styles.rupee}>₹</span>

              <input
                type="number"
                placeholder="Enter counter price"
                value={counterPrice}
                onChange={(e) =>
                  setCounterPrice(e.target.value)
                }
                style={styles.input}
              />
            </div>

            <div style={styles.modalButtons}>
              <button
                onClick={() => setShowModal(false)}
                style={styles.cancelButton}
              >
                Cancel
              </button>

              <button
                onClick={sendCounter}
                style={styles.sendButton}
              >
                Send Counter Offer
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
    height: "70px",
    background: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 8%",
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
  },

  logo: {
    fontSize: "25px",
    fontWeight: "800",
    color: "#2563eb",
  },

  headerTitle: {
    color: "#64748b",
    fontWeight: "600",
  },

  container: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "50px 25px",
  },

  topSection: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "35px",
  },

  smallTitle: {
    color: "#2563eb",
    fontWeight: "800",
    letterSpacing: "1.5px",
    fontSize: "13px",
  },

  heading: {
    fontSize: "38px",
    margin: "8px 0",
  },

  subtitle: {
    color: "#64748b",
    fontSize: "16px",
  },

  offerCount: {
    background: "#ffffff",
    padding: "15px 20px",
    borderRadius: "12px",
    fontWeight: "700",
    boxShadow: "0 5px 20px rgba(0,0,0,0.06)",
  },

  offersContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },

  offerCard: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "25px",
    display: "flex",
    alignItems: "center",
    gap: "25px",
    boxShadow: "0 8px 25px rgba(0,0,0,0.06)",
  },

  productIcon: {
    width: "80px",
    height: "80px",
    borderRadius: "15px",
    background: "#eef4ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "42px",
    flexShrink: 0,
  },

  offerDetails: {
    flex: 1,
  },

  productName: {
    margin: "0 0 8px",
    fontSize: "21px",
  },

  originalPrice: {
    color: "#64748b",
    margin: "5px 0 15px",
  },

  offerPriceBox: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },

  counterBox: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    marginTop: "8px",
    color: "#92400e",
  },

  actionSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "15px",
  },

  status: {
    padding: "7px 13px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "700",
  },

  buttons: {
    display: "flex",
    gap: "8px",
  },

  acceptButton: {
    border: "none",
    background: "#16a34a",
    color: "white",
    padding: "10px 14px",
    borderRadius: "8px",
    fontWeight: "700",
    cursor: "pointer",
  },

  rejectButton: {
    border: "none",
    background: "#dc2626",
    color: "white",
    padding: "10px 14px",
    borderRadius: "8px",
    fontWeight: "700",
    cursor: "pointer",
  },

  counterButton: {
    border: "none",
    background: "#2563eb",
    color: "white",
    padding: "10px 14px",
    borderRadius: "8px",
    fontWeight: "700",
    cursor: "pointer",
  },

  clearButton: {
    marginTop: "25px",
    padding: "12px 18px",
    border: "1px solid #fecaca",
    background: "#fff1f2",
    color: "#dc2626",
    borderRadius: "9px",
    fontWeight: "700",
    cursor: "pointer",
  },

  emptyBox: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "70px 30px",
    textAlign: "center",
    boxShadow: "0 8px 25px rgba(0,0,0,0.06)",
  },

  emptyIcon: {
    fontSize: "60px",
    marginBottom: "15px",
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },

  modal: {
    width: "420px",
    background: "#ffffff",
    borderRadius: "20px",
    padding: "35px",
    textAlign: "center",
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
  },

  modalIcon: {
    fontSize: "50px",
  },

  modalText: {
    color: "#64748b",
    lineHeight: "1.6",
  },

  inputWrapper: {
    display: "flex",
    alignItems: "center",
    border: "2px solid #dbe3f0",
    borderRadius: "10px",
    height: "55px",
    padding: "0 15px",
    marginTop: "20px",
  },

  rupee: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#64748b",
  },

  input: {
    border: "none",
    outline: "none",
    width: "100%",
    fontSize: "17px",
    padding: "10px",
  },

  modalButtons: {
    display: "flex",
    gap: "10px",
    marginTop: "25px",
  },

  cancelButton: {
    flex: 1,
    padding: "13px",
    border: "1px solid #d1d5db",
    background: "white",
    borderRadius: "9px",
    fontWeight: "700",
    cursor: "pointer",
  },

  sendButton: {
    flex: 1,
    padding: "13px",
    border: "none",
    background: "#2563eb",
    color: "white",
    borderRadius: "9px",
    fontWeight: "700",
    cursor: "pointer",
  },
};

export default SellerOffers;