
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

function getImageUrl(image) {
  if (!image) return "";

  if (typeof image === "string") {
    if (image.startsWith("http")) return image;

    return `http://localhost:5000/${image.replace(/^\/+/, "")}`;
  }

  if (typeof image === "object") {
    return (
      image.url ||
      image.secure_url ||
      image.path ||
      image.imageUrl ||
      ""
    );
  }

  return "";
}

function BargainPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const product = location.state?.product;

  const [offerPrice, setOfferPrice] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  if (!product) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <h2>Product Not Selected</h2>
          <p>Please open a product and select Bargain.</p>
          <button
            style={styles.backButton}
            onClick={() => navigate("/products")}
          >
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  const productId = product._id || product.id;
  const originalPrice = Number(product.price ?? product.amount);
  const productName = product.name || product.title || "Product";

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
    const token = localStorage.getItem("token");

    if (!productId) {
      setError("Product ID is missing. Reopen Product Details.");
      return;
    }

    if (!Number.isFinite(originalPrice) || originalPrice <= 0) {
      setError("The original product price is invalid.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Please enter a valid offer price.");
      return;
    }

    if (amount >= originalPrice) {
      setError("Your offer must be lower than the original price.");
      return;
    }

    if (!token) {
      setError("Please log in before sending an offer.");
      navigate("/login");
      return;
    }

    try {
      setSending(true);

      const response = await axios.post(
        `${API_URL}/bargaining`,
        {
          productId: String(productId),
          offerPrice: amount,
          message: offerMessage.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage(
        response.data?.message ||
          "Your offer has been submitted successfully."
      );

      setOfferPrice("");
      setOfferMessage("");
    } catch (err) {
      console.error(
        "Bargaining request failed:",
        err.response?.status,
        err.response?.data || err.message
      );

      if (err.response) {
        setError(
          err.response.data?.message ||
            `Offer failed. Server returned status ${err.response.status}.`
        );
      } else {
        setError(
          "Cannot connect to the server. Check whether the backend is running."
        );
      }
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
          type="button"
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
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div style={styles.noImage}>📦</div>
            )}

            <p style={styles.category}>
              {product.category || "GENERAL"}
            </p>

            <h1>{productName}</h1>

            <p style={styles.seller}>
              Seller: <strong>{seller}</strong>
            </p>

            <p style={styles.price}>
              {Number.isFinite(originalPrice)
                ? `₹${originalPrice.toLocaleString("en-IN")}`
                : "Price unavailable"}
            </p>

            <p style={styles.hint}>Seller's current price</p>
          </section>

          <section style={styles.offerSection}>
            <h2>🤝 Make an Offer</h2>

            <p style={styles.hint}>
              Enter your proposed price and an optional message
              for the seller.
            </p>

            <form onSubmit={handleOffer}>
              <label style={styles.label} htmlFor="offerPrice">
                Your Offer Price (₹)
              </label>

              <input
                id="offerPrice"
                type="number"
                min="0.01"
                max={
                  Number.isFinite(originalPrice)
                    ? originalPrice - 0.01
                    : undefined
                }
                step="0.01"
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

              <label style={styles.label} htmlFor="offerMessage">
                Message to Seller (Optional)
              </label>

              <textarea
                id="offerMessage"
                value={offerMessage}
                onChange={(event) => {
                  setOfferMessage(event.target.value);
                  setMessage("");
                  setError("");
                }}
                placeholder="Write a message to the seller"
                maxLength={300}
                rows={3}
                style={styles.textarea}
              />

              <button
                type="submit"
                disabled={sending}
                style={{
                  ...styles.offerButton,
                  opacity: sending ? 0.7 : 1,
                  cursor: sending ? "wait" : "pointer",
                }}
              >
                {sending ? "Sending..." : "Send Offer →"}
              </button>
            </form>

            {message && (
              <div style={styles.success} role="status">
                <strong>✓ Offer submitted</strong>
                <p>{message}</p>
                <p>
                  The request has been accepted by the server.
                  Check Seller Offers after configuring the seller
                  requests API and page.
                </p>
              </div>
            )}

            {error && (
              <p style={styles.error} role="alert">
                {error}
              </p>
            )}

            <div style={styles.infoBox}>
              <strong>How bargaining works</strong>
              <p>
                1. Buyer submits an offer for this product.
                <br />
                2. The backend validates and saves the request.
                <br />
                3. Seller views the request in Seller Offers.
                <br />
                4. Seller can accept, reject, or make a counter offer
                when those APIs are implemented.
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
  textarea: {
    boxSizing: "border-box",
    width: "100%",
    padding: "12px",
    fontSize: "15px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    resize: "vertical",
    fontFamily: "Arial, sans-serif",
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
  },
  success: {
    padding: "12px",
    background: "#dcfce7",
    color: "#166534",
    borderRadius: "8px",
    lineHeight: 1.6,
    marginTop: "12px",
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
