import { useState } from "react";

function BargainPage() {
  const [offerPrice, setOfferPrice] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const product = {
    name: "Engineering Mathematics Book",
    originalPrice: 500,
    seller: "C-Mart Seller",
  };

  const handleOffer = () => {
    // Clear old success message
    setSuccessMessage("");

    if (!offerPrice) {
      alert("Please enter your offer price.");
      return;
    }

    if (Number(offerPrice) <= 0) {
      alert("Please enter a valid price.");
      return;
    }

    if (Number(offerPrice) >= product.originalPrice) {
      alert("Your offer should be lower than the original price.");
      return;
    }

    // Create new offer
    const newOffer = {
      id: Date.now(),
      productName: product.name,
      originalPrice: product.originalPrice,
      offerPrice: Number(offerPrice),
      status: "Pending",
    };

    // Get previously saved offers
    let existingOffers = [];

    try {
      existingOffers =
        JSON.parse(localStorage.getItem("cmart_offers")) || [];
    } catch (error) {
      existingOffers = [];
    }

    // Save new offer
    localStorage.setItem(
      "cmart_offers",
      JSON.stringify([...existingOffers, newOffer])
    );

    // Show success message
    setSuccessMessage(
      `Offer of ₹${offerPrice} sent successfully to the seller!`
    );

    // Clear input
    setOfferPrice("");
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logo}>🛒 C-Mart</div>
        <div style={styles.headerText}>Campus Bazar</div>
      </header>

      {/* Main Content */}
      <main style={styles.container}>
        <div style={styles.backButton}>← Back to Products</div>

        <div style={styles.card}>
          {/* Product Section */}
          <div style={styles.productSection}>
            <div style={styles.productImage}>📚</div>

            <div>
              <p style={styles.category}>BOOKS</p>

              <h1 style={styles.productName}>
                {product.name}
              </h1>

              <p style={styles.seller}>
                Seller: <strong>{product.seller}</strong>
              </p>

              <div style={styles.price}>
                ₹{product.originalPrice}
              </div>

              <p style={styles.priceText}>
                Seller's current price
              </p>
            </div>
          </div>

          {/* Bargain Section */}
          <div style={styles.bargainSection}>
            <div style={styles.bargainHeader}>
              <span style={styles.moneyIcon}>💰</span>

              <div>
                <h2 style={styles.bargainTitle}>
                  Make an Offer
                </h2>

                <p style={styles.bargainSubtitle}>
                  Think the price is too high? Make your own offer.
                </p>
              </div>
            </div>

            <label style={styles.label}>
              Your Offer Price
            </label>

            <div style={styles.inputWrapper}>
              <span style={styles.rupee}>₹</span>

              <input
                type="number"
                placeholder="Enter your price"
                value={offerPrice}
                onChange={(e) => {
                  setOfferPrice(e.target.value);
                  setSuccessMessage("");
                }}
                style={styles.input}
              />
            </div>

            <p style={styles.hint}>
              💡 Original price: ₹{product.originalPrice}
            </p>

            <button
              onClick={handleOffer}
              style={styles.offerButton}
            >
              Send Offer →
            </button>

            {/* Success Message */}
            {successMessage && (
              <div style={styles.successMessage}>
                <span style={styles.successIcon}>✓</span>

                <span>{successMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* Information Box */}
        <div style={styles.infoBox}>
          <span style={styles.infoIcon}>🤝</span>

          <div>
            <strong>How bargaining works</strong>

            <p>
              Enter your price and send an offer to the seller.
              The seller can accept it, reject it, or send you a
              counter offer.
            </p>
          </div>
        </div>
      </main>
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

  headerText: {
    color: "#64748b",
    fontWeight: "600",
  },

  container: {
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "45px 25px",
  },

  backButton: {
    color: "#64748b",
    marginBottom: "25px",
    fontWeight: "600",
    cursor: "pointer",
  },

  card: {
    background: "#ffffff",
    borderRadius: "20px",
    padding: "35px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "40px",
    boxShadow: "0 10px 35px rgba(0,0,0,0.07)",
  },

  productSection: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },

  productImage: {
    width: "100%",
    height: "240px",
    background: "#eef4ff",
    borderRadius: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "90px",
    marginBottom: "25px",
  },

  category: {
    color: "#2563eb",
    fontSize: "13px",
    fontWeight: "800",
    letterSpacing: "1.5px",
  },

  productName: {
    fontSize: "28px",
    margin: "8px 0",
  },

  seller: {
    color: "#64748b",
  },

  price: {
    fontSize: "32px",
    fontWeight: "800",
    marginTop: "20px",
  },

  priceText: {
    color: "#94a3b8",
    fontSize: "14px",
  },

  bargainSection: {
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "30px",
    alignSelf: "center",
  },

  bargainHeader: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    marginBottom: "30px",
  },

  moneyIcon: {
    fontSize: "35px",
  },

  bargainTitle: {
    margin: 0,
    fontSize: "24px",
  },

  bargainSubtitle: {
    margin: "5px 0 0",
    color: "#64748b",
    fontSize: "14px",
    lineHeight: "1.5",
  },

  label: {
    display: "block",
    fontWeight: "700",
    marginBottom: "10px",
  },

  inputWrapper: {
    display: "flex",
    alignItems: "center",
    border: "2px solid #dbe3f0",
    borderRadius: "10px",
    padding: "0 14px",
    height: "55px",
  },

  rupee: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#64748b",
  },

  input: {
    border: "none",
    outline: "none",
    fontSize: "18px",
    width: "100%",
    padding: "10px",
  },

  hint: {
    color: "#64748b",
    fontSize: "13px",
    marginTop: "10px",
  },

  offerButton: {
    width: "100%",
    marginTop: "20px",
    padding: "15px",
    border: "none",
    borderRadius: "10px",
    background: "#2563eb",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
  },

  successMessage: {
    marginTop: "15px",
    padding: "14px 16px",
    background: "#dcfce7",
    color: "#166534",
    border: "1px solid #86efac",
    borderRadius: "10px",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    lineHeight: "1.4",
  },

  successIcon: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    background: "#16a34a",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
    flexShrink: 0,
  },

  infoBox: {
    marginTop: "25px",
    background: "#eef6ff",
    borderRadius: "15px",
    padding: "20px",
    display: "flex",
    gap: "15px",
    lineHeight: "1.5",
  },

  infoIcon: {
    fontSize: "25px",
  },
};

export default BargainPage;