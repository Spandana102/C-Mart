
import { useCallback, useEffect, useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import axios from "axios";
import { API_ORIGIN, API_URL } from "../services/apiConfig";

const formatPrice = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });

const getImageUrl = (image) => {
  if (!image) return "";

  if (typeof image === "string") {
    if (image.startsWith("http")) return image;

    return `${API_ORIGIN}/${image.replace(/^\/+/, "")}`;
  }

  if (typeof image === "object") {
    return (
      image.secure_url ||
      image.url ||
      image.imageUrl ||
      image.path ||
      ""
    );
  }

  return "";
};

const statusColors = {
  Pending: {
    background: "#dbeafe",
    color: "#1d4ed8",
  },
  Accepted: {
    background: "#dcfce7",
    color: "#166534",
  },
  Rejected: {
    background: "#fee2e2",
    color: "#991b1b",
  },
  Countered: {
    background: "#fef3c7",
    color: "#92400e",
  },
};

function BargainPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { productId: routeProductId } = useParams();

  const passedProduct = location.state?.product || null;

  const [product, setProduct] = useState(passedProduct);
  const [productLoading, setProductLoading] = useState(false);
  const [productError, setProductError] = useState("");

  const [offerPrice, setOfferPrice] = useState("");
  const [offerMessage, setOfferMessage] = useState("");

  const [offers, setOffers] = useState([]);
  const [offersLoading, setOffersLoading] = useState(false);

  const [sending, setSending] = useState(false);
  const [busyId, setBusyId] = useState("");

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const currentProductId =
    routeProductId ||
    passedProduct?._id ||
    passedProduct?.id ||
    "";

  const token = localStorage.getItem("token");

  // ==========================================
  // FETCH PRODUCT DETAILS
  // ==========================================

  useEffect(() => {
    if (!currentProductId) {
      setProduct(null);
      return;
    }

    let cancelled = false;

    const fetchProduct = async () => {
      setProductLoading(true);
      setProductError("");

      try {
        const response = await axios.get(
          `${API_URL}/products/${currentProductId}`
        );

        if (!cancelled) {
          setProduct(response.data?.product || null);
        }
      } catch (err) {
        if (!cancelled) {
          setProductError(
            err.response?.data?.message ||
              "Unable to load product details."
          );
        }
      } finally {
        if (!cancelled) {
          setProductLoading(false);
        }
      }
    };

    fetchProduct();

    return () => {
      cancelled = true;
    };
  }, [currentProductId]);

  // ==========================================
  // FETCH BUYER'S OFFERS
  // ==========================================

  const loadOffers = useCallback(async () => {
    const currentToken = localStorage.getItem("token");

    if (!currentToken) {
      setOffers([]);
      return;
    }

    setOffersLoading(true);

    try {
      const response = await axios.get(
        `${API_URL}/bargaining/buyer`,
        {
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        }
      );

      const allOffers = Array.isArray(response.data?.offers)
        ? response.data.offers
        : [];

      const productOffers = allOffers.filter((offer) => {
        const id =
          typeof offer.productId === "object"
            ? offer.productId?._id
            : offer.productId;

        return String(id) === String(currentProductId);
      });

      setOffers(productOffers);
    } catch (err) {
      console.error(
        "Load buyer offers error:",
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.message ||
          "Unable to load your offers."
      );
    } finally {
      setOffersLoading(false);
    }
  }, [currentProductId]);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  // ==========================================
  // SUBMIT BUYER OFFER
  // ==========================================

  const handleOffer = async (event) => {
    event.preventDefault();

    if (sending) return;

    setError("");
    setSuccess("");

    const amount = Number(offerPrice);
    const listedPrice = Number(product?.price);

    const currentToken = localStorage.getItem("token");

    if (!currentToken) {
      navigate("/login");
      return;
    }

    if (!currentProductId || !product) {
      setError("Product details are unavailable.");
      return;
    }

    if (
      offerPrice.trim() === "" ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setError("Please enter a valid offer price.");
      return;
    }

    if (
      !Number.isFinite(listedPrice) ||
      listedPrice <= 0
    ) {
      setError("Product price is invalid.");
      return;
    }

    if (amount >= listedPrice) {
      setError(
        "Your offer must be lower than the listed price."
      );
      return;
    }

    const existingPending = offers.some(
      (offer) => offer.status === "Pending"
    );

    if (existingPending) {
      setError(
        "You already have a pending offer for this product."
      );
      return;
    }

    try {
      setSending(true);

      const response = await axios.post(
        `${API_URL}/bargaining`,
        {
          productId: String(currentProductId),
          offerPrice: amount,
          message: offerMessage.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        }
      );

      if (response.data?.success === false) {
        throw new Error(
          response.data?.message ||
            "Offer submission failed."
        );
      }

      setSuccess(
        "Your bargaining offer was submitted successfully. The seller can now review it."
      );

      setOfferPrice("");
      setOfferMessage("");

      await loadOffers();
    } catch (err) {
      console.error(
        "Submit bargain error:",
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to submit offer."
      );
    } finally {
      setSending(false);
    }
  };

  // ==========================================
  // BUYER ACCEPT / REJECT COUNTER OFFER
  // ==========================================

  const respondToCounter = async (offer, action) => {
    if (busyId) return;

    const currentToken = localStorage.getItem("token");

    if (!currentToken) {
      navigate("/login");
      return;
    }

    setBusyId(offer._id);
    setError("");
    setSuccess("");

    try {
      const response = await axios.patch(
        `${API_URL}/bargaining/${offer._id}/buyer-${action}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        }
      );

      if (response.data?.success === false) {
        throw new Error(
          response.data?.message ||
            "Unable to update counter offer."
        );
      }

      setSuccess(
        action === "accept"
          ? "You accepted the seller's counter offer!"
          : "You rejected the seller's counter offer."
      );

      await loadOffers();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to respond to counter offer."
      );
    } finally {
      setBusyId("");
    }
  };

  // ==========================================
  // PRODUCT INFORMATION
  // ==========================================

  const productName =
    product?.name || product?.title || "Product";

  const originalPrice = Number(
    product?.price ?? product?.amount
  );

  const sellerObject =
    product?.sellerId &&
    typeof product.sellerId === "object"
      ? product.sellerId
      : product?.seller;

  const sellerName =
    sellerObject?.fullName ||
    sellerObject?.name ||
    product?.sellerName ||
    "C-Mart Seller";

  const firstImage =
    product?.images?.[0] ||
    product?.image ||
    product?.imageUrl ||
    product?.productImage;

  const imageUrl = getImageUrl(firstImage);

  const hasPendingOffer = offers.some(
    (offer) => offer.status === "Pending"
  );

  // ==========================================
  // PRODUCT NOT SELECTED
  // ==========================================

  if (!currentProductId) {
    return (
      <div style={styles.page}>
        <main style={styles.emptyBox}>
          <h2>Product Not Selected</h2>
          <p>Please select a product from the marketplace.</p>

          <button
            type="button"
            style={styles.primaryButton}
            onClick={() => navigate("/products")}
          >
            Back to Marketplace
          </button>
        </main>
      </div>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h2 style={styles.logo}>🛒 C-MART</h2>

        <div style={styles.navButtons}>
          <button
            type="button"
            style={styles.navButton}
            onClick={() => navigate("/")}
          >
            Dashboard
          </button>

          <button
            type="button"
            style={styles.navButton}
            onClick={() => navigate("/products")}
          >
            Marketplace
          </button>
        </div>
      </header>

      <main style={styles.container}>
        <button
          type="button"
          style={styles.backButton}
          onClick={() =>
            navigate(`/product/${currentProductId}`)
          }
        >
          ← Back to Product
        </button>

        <div style={styles.card}>
          {/* PRODUCT INFORMATION */}
          <section>
            {productLoading && (
              <p>Loading product details...</p>
            )}

            {productError && (
              <p style={styles.error}>{productError}</p>
            )}

            {imageUrl ? (
              <img
                src={imageUrl}
                alt={productName}
                style={styles.image}
              />
            ) : (
              <div style={styles.noImage}>📦</div>
            )}

            <p style={styles.category}>
              {product?.category || "PRODUCT"}
            </p>

            <h1>{productName}</h1>

            <p style={styles.seller}>
              Seller: <strong>{sellerName}</strong>
            </p>

            <p style={styles.price}>
              {Number.isFinite(originalPrice)
                ? `₹${formatPrice(originalPrice)}`
                : "Price unavailable"}
            </p>

            <p style={styles.hint}>
              Seller's listed price
            </p>

            {product?.description && (
              <p style={styles.description}>
                {product.description}
              </p>
            )}
          </section>

          {/* MAKE OFFER */}
          <section style={styles.offerSection}>
            <h2>🤝 Make an Offer</h2>

            <p style={styles.hint}>
              Enter your proposed price. The seller can
              accept, reject, or send a counter offer.
            </p>

            <form onSubmit={handleOffer}>
              <label
                htmlFor="offerPrice"
                style={styles.label}
              >
                Your Offer Price (₹)
              </label>

              <input
                id="offerPrice"
                type="number"
                min="0.01"
                max={
                  Number.isFinite(originalPrice)
                    ? Math.max(
                        0,
                        originalPrice - 0.01
                      )
                    : undefined
                }
                step="0.01"
                value={offerPrice}
                onChange={(event) => {
                  setOfferPrice(event.target.value);
                  setError("");
                  setSuccess("");
                }}
                placeholder="Enter your offer"
                style={styles.input}
                disabled={sending || hasPendingOffer}
                required
              />

              <label
                htmlFor="offerMessage"
                style={styles.label}
              >
                Message to Seller (Optional)
              </label>

              <textarea
                id="offerMessage"
                rows={3}
                maxLength={300}
                value={offerMessage}
                onChange={(event) =>
                  setOfferMessage(event.target.value)
                }
                placeholder="Write a message to the seller..."
                style={styles.textarea}
                disabled={sending || hasPendingOffer}
              />

              <button
                type="submit"
                disabled={
                  sending ||
                  hasPendingOffer ||
                  productLoading ||
                  !product
                }
                style={{
                  ...styles.primaryButton,
                  width: "100%",
                  opacity:
                    sending || hasPendingOffer ? 0.6 : 1,
                }}
              >
                {sending
                  ? "Sending Offer..."
                  : hasPendingOffer
                  ? "Offer Already Pending"
                  : "Send Offer"}
              </button>
            </form>

            {success && (
              <div style={styles.success} role="status">
                ✓ {success}
              </div>
            )}

            {error && (
              <div style={styles.error} role="alert">
                {error}
              </div>
            )}

            <div style={styles.infoBox}>
              <strong>How Bargaining Works</strong>

              <ol style={{ paddingLeft: 20 }}>
                <li>Buyer submits an offer.</li>
                <li>Seller reviews the request.</li>
                <li>
                  Seller accepts, rejects, or counters.
                </li>
                <li>
                  Buyer can accept or reject a counter.
                </li>
              </ol>
            </div>
          </section>
        </div>

        {/* MY OFFERS */}
        <section style={styles.offersSection}>
          <div style={styles.offersHeader}>
            <div>
              <h2>My Bargaining Offers</h2>
              <p style={styles.hint}>
                Track your offers for this product.
              </p>
            </div>

            <button
              type="button"
              style={styles.backButton}
              onClick={loadOffers}
              disabled={offersLoading}
            >
              {offersLoading ? "Loading..." : "↻ Refresh"}
            </button>
          </div>

          {offersLoading ? (
            <p>Loading your offers...</p>
          ) : offers.length === 0 ? (
            <div style={styles.noOffers}>
              <p>No offers submitted for this product yet.</p>
            </div>
          ) : (
            <div style={styles.offerList}>
              {offers.map((offer) => {
                const status = offer.status || "Pending";

                const statusStyle =
                  statusColors[status] ||
                  statusColors.Pending;

                return (
                  <div
                    key={offer._id}
                    style={styles.offerCard}
                  >
                    <div style={styles.offerTop}>
                      <strong>
                        Your Offer: ₹
                        {formatPrice(offer.offerPrice)}
                      </strong>

                      <span
                        style={{
                          ...styles.statusBadge,
                          ...statusStyle,
                        }}
                      >
                        {status}
                      </span>
                    </div>

                    {offer.counterPrice != null && (
                      <p style={styles.counterPrice}>
                        Seller Counter: ₹
                        {formatPrice(offer.counterPrice)}
                      </p>
                    )}

                    {offer.message && (
                      <p style={styles.hint}>
                        Message: {offer.message}
                      </p>
                    )}

                    {status === "Countered" && (
                      <div style={styles.counterActions}>
                        <button
                          type="button"
                          style={{
                            ...styles.primaryButton,
                            background: "#16a34a",
                          }}
                          disabled={Boolean(busyId)}
                          onClick={() =>
                            respondToCounter(
                              offer,
                              "accept"
                            )
                          }
                        >
                          {busyId === offer._id
                            ? "Updating..."
                            : "Accept Counter"}
                        </button>

                        <button
                          type="button"
                          style={{
                            ...styles.primaryButton,
                            background: "#dc2626",
                          }}
                          disabled={Boolean(busyId)}
                          onClick={() =>
                            respondToCounter(
                              offer,
                              "reject"
                            )
                          }
                        >
                          Reject Counter
                        </button>
                      </div>
                    )}

                    {status === "Accepted" && (
                      <p style={styles.acceptedText}>
                        ✓ Offer accepted. You can proceed
                        with the next purchase steps.
                      </p>
                    )}

                    {status === "Rejected" && (
                      <p style={styles.rejectedText}>
                        This offer was rejected.
                      </p>
                    )}

                    {offer.createdAt && (
                      <p style={styles.date}>
                        Submitted:{" "}
                        {new Date(
                          offer.createdAt
                        ).toLocaleString("en-IN")}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

// ==========================================
// STYLES
// ==========================================

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f7fb",
    fontFamily: "Arial, sans-serif",
    color: "#172033",
  },

  header: {
    padding: "18px 6%",
    background: "#fff",
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 15,
    boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
  },

  logo: {
    color: "#2563eb",
    margin: 0,
  },

  navButtons: {
    display: "flex",
    gap: 10,
  },

  navButton: {
    background: "#eff6ff",
    border: "none",
    padding: "10px 14px",
    borderRadius: 8,
    cursor: "pointer",
    color: "#2563eb",
    fontWeight: 700,
  },

  container: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "30px 20px",
  },

  backButton: {
    padding: "10px 16px",
    marginBottom: 15,
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    background: "#fff",
    cursor: "pointer",
  },

  card: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(270px, 1fr))",
    gap: 30,
    padding: 25,
    background: "#fff",
    borderRadius: 16,
    boxShadow: "0 8px 28px rgba(0,0,0,0.05)",
  },

  image: {
    width: "100%",
    height: 260,
    objectFit: "contain",
    background: "#f1f5f9",
    borderRadius: 12,
  },

  noImage: {
    height: 260,
    display: "grid",
    placeItems: "center",
    fontSize: 65,
    background: "#f1f5f9",
    borderRadius: 12,
  },

  category: {
    color: "#2563eb",
    fontWeight: 800,
    fontSize: 13,
    marginTop: 20,
  },

  seller: {
    color: "#64748b",
  },

  price: {
    fontSize: 30,
    fontWeight: 800,
    marginBottom: 5,
  },

  description: {
    color: "#475569",
    lineHeight: 1.7,
    marginTop: 20,
  },

  hint: {
    color: "#64748b",
    lineHeight: 1.6,
  },

  offerSection: {
    padding: 22,
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    alignSelf: "start",
  },

  label: {
    display: "block",
    margin: "20px 0 8px",
    fontWeight: 700,
  },

  input: {
    boxSizing: "border-box",
    width: "100%",
    padding: 14,
    fontSize: 16,
    border: "1px solid #cbd5e1",
    borderRadius: 8,
  },

  textarea: {
    boxSizing: "border-box",
    width: "100%",
    padding: 12,
    fontSize: 15,
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    resize: "vertical",
    fontFamily: "Arial, sans-serif",
  },

  primaryButton: {
    marginTop: 15,
    padding: "12px 18px",
    border: "none",
    borderRadius: 9,
    background: "#2563eb",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },

  success: {
    padding: 14,
    background: "#dcfce7",
    color: "#166534",
    borderRadius: 9,
    marginTop: 18,
  },

  error: {
    padding: 14,
    background: "#fee2e2",
    color: "#991b1b",
    borderRadius: 9,
    marginTop: 18,
  },

  infoBox: {
    marginTop: 25,
    padding: 15,
    background: "#eff6ff",
    borderRadius: 9,
    lineHeight: 1.8,
  },

  offersSection: {
    background: "#fff",
    borderRadius: 16,
    padding: 25,
    marginTop: 30,
    boxShadow: "0 8px 28px rgba(0,0,0,0.05)",
  },

  offersHeader: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 15,
  },

  noOffers: {
    textAlign: "center",
    padding: 25,
    background: "#f8fafc",
    borderRadius: 10,
  },

  offerList: {
    display: "flex",
    flexDirection: "column",
    gap: 15,
    marginTop: 20,
  },

  offerCard: {
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 20,
  },

  offerTop: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },

  statusBadge: {
    borderRadius: 20,
    padding: "7px 14px",
    fontSize: 13,
    fontWeight: 800,
  },

  counterPrice: {
    color: "#92400e",
    fontWeight: 800,
    fontSize: 18,
    marginTop: 15,
  },

  counterActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
  },

  acceptedText: {
    color: "#166534",
    fontWeight: 600,
  },

  rejectedText: {
    color: "#991b1b",
  },

  date: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 15,
  },

  emptyBox: {
    maxWidth: 550,
    margin: "80px auto",
    background: "#fff",
    borderRadius: 15,
    padding: 35,
    textAlign: "center",
  },
};

export default BargainPage;
