
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

function getImageUrl(image) {
  if (!image) return "";

  if (typeof image === "string") {
    return image.startsWith("http")
      ? image
      : `http://localhost:5000/${image.replace(/^\/+/, "")}`;
  }

  if (typeof image === "object") {
    return image.url || image.secure_url || image.path || "";
  }

  return "";
}

function BargainPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const product = location.state?.product;

  const [offerPrice, setOfferPrice] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  if (!product) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <h2>Product not selected</h2>
          <p>Please select a product before bargaining.</p>
          <button
            style={styles.backButton}
            onClick={() => navigate("/")}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const productId = product._id || product.id;

  const originalPrice = Number(
    product.price ?? product.amount
  );

  const productName =
    product.name || product.title || "Product";

  const seller =
    product.seller?.fullName ||
    product.seller?.name ||
    product.sellerName ||
    product.owner?.fullName ||
    "Seller";

  const image = getImageUrl(
    product.images?.[0] ||
      product.image ||
      product.imageUrl ||
      product.productImage
  );

  const handleOffer = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    const amount = Number(offerPrice);

    if (!productId) {
      setError("Product ID is missing. Please reopen the product.");
      return;
    }

    if (!Number.isFinite(originalPrice) || originalPrice <= 0) {
      setError("Valid product price is not available.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Please enter a valid offer price.");
      return;
    }

    if (amount >= originalPrice) {
      setError("Offer must be lower than the original price.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please log in before sending an offer.");
      return;
    }

    try {
      setSending(true);

      // Change this endpoint if your backend uses a different route.
      const response = await axios.post(
        `${API_URL}/bargaining`,
        {
          productId,
          offerPrice: amount,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage(
        response.data?.message ||
          "Offer submitted successfully."
      );
      setOfferPrice("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Offer could not be submitted. Check the bargaining API and try again."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h2 style={styles.logo}>🛒 C-Mart</h2>
        <span>Product Bargaining</span>
      </header>

      <main style={styles.container}>
        <button
          style={styles.backButton}
          onClick={() => navigate(-1)}
        >
          ← Back to Product
        </button>

        <div style={styles.card}>
          <section>
            {image ? (
              <img
                src={image}
                alt={productName}
                style={styles.image}
              />
            ) : (
              <div style={styles.noImage}>
                📦
              </div>
            )}

            <p style={styles.category}>
              {product.category || "GENERAL"}
            </p>

            <h1>{productName}</h1>

            <p style={styles.seller}>
              Seller: <strong>{seller}</strong>
            </p>

            <p style={styles.price}>
              ₹{originalPrice.toLocaleString("en-IN")}
            </p>

            <p style={styles.hint}>
              Seller's current price
            </p>
          </section>

          <section style={styles.offerSection}>
            <h2>🤝 Make an Offer</h2>

            <p style={styles.hint}>
              Enter the price you are willing to pay.
              The seller can respond to your offer.
            </p>

            <form onSubmit={handleOffer}>
              <label style={styles.label}>
                Your Offer Price (₹)
              </label>

              <input
                type="number"
                min="1"
                max={originalPrice - 1}
                step="1"
                required
                value={offerPrice}
                onChange={(event) => {
                  setOfferPrice(event.target.value);
                  setMessage("");
                  setError("");
                }}
                placeholder="Enter your offer"
                style={styles.input}
              />

              <button
                type="submit"
                disabled={sending}
                style={{
                  ...styles.offerButton,
                  opacity: sending ? 0.7 : 1,
                }}
              >
                {sending ? "Sending..." : "Send Offer →"}
              </button>
            </form>

            {message && (
              <p style={styles.success}>{message}</p>
            )}

            {error && (
              <p style={styles.error}>{error}</p>
            )}

            <div style={styles.infoBox}>
              <strong>How bargaining works</strong>
              <p>
                1. Buyer sends an offer.
                <br />
                2. Seller accepts, rejects, or counters.
                <br />
                3. Buyer can respond to the counter-offer.
              </p>
            </div>
          </section>
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
    padding: "20px 7%",
    background: "#fff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 2px 10px #0000000d",
  },
  logo: {
    color: "#2563eb",
    margin: 0,
  },
  container: {
    maxWidth: "1050px",
    margin: "auto",
    padding: "30px 20px",
  },
  backButton: {
    padding: "10px 16px",
    marginBottom: "20px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    background: "#fff",
    cursor: "pointer",
  },
  card: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))",
    gap: "30px",
    padding: "30px",
    background: "#fff",
    borderRadius: "16px",
    boxShadow: "0 8px 28px #0000000d",
  },
  image: {
    width: "100%",
    height: "260px",
    objectFit: "contain",
    background: "#f1f5f9",
    borderRadius: "12px",
  },
  noImage: {
    height: "260px",
    display: "grid",
    placeItems: "center",
    fontSize: "70px",
    background: "#f1f5f9",
    borderRadius: "12px",
  },
  category: {
    color: "#2563eb",
    fontWeight: "bold",
    fontSize: "13px",
  },
  seller: {
    color: "#64748b",
  },
  price: {
    fontSize: "30px",
    fontWeight: "bold",
    marginBottom: "5px",
  },
  hint: {
    color: "#64748b",
    lineHeight: 1.6,
  },
  offerSection: {
    padding: "22px",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    alignSelf: "start",
  },
  label: {
    display: "block",
    margin: "22px 0 8px",
    fontWeight: "bold",
  },
  input: {
    boxSizing: "border-box",
    width: "100%",
    padding: "14px",
    fontSize: "17px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
  },
  offerButton: {
    width: "100%",
    marginTop: "16px",
    padding: "14px",
    border: "none",
    borderRadius: "8px",
    background: "#2563eb",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
  },
  success: {
    padding: "12px",
    background: "#dcfce7",
    color: "#166534",
    borderRadius: "8px",
  },
  error: {
    padding: "12px",
    background: "#fee2e2",
    color: "#991b1b",
    borderRadius: "8px",
  },
  infoBox: {
    marginTop: "25px",
    padding: "15px",
    background: "#eff6ff",
    borderRadius: "8px",
    lineHeight: 1.7,
  },
};

export default BargainPage;