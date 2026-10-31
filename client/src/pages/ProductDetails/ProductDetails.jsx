
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import "./ProductDetails.css";
const API_URL = "http://localhost:5000/api";
const SERVER_URL = "http://localhost:5000";
// ==========================================
// IMAGE HELPERS
// ==========================================
function getImageUrl(image) {
  if (!image) return "";
  if (Array.isArray(image)) {
    return image.map(getImageUrl).find(Boolean) || "";
  }
  if (typeof image === "object") {
    return getImageUrl(image.secure_url || image.url || image.imageUrl || image.path || image.src);
  }
  if (typeof image !== "string") return "";
  const value = image.trim().replace(/\\/g, "/");
  if (!value) return "";
  if (/^https?:\/\//i.test(value) || value.startsWith("data:image/") || value.startsWith("blob:")) return value;
  if (value.startsWith("//")) return `https:${value}`;
  return `${SERVER_URL}/${value.replace(/^\/+/, "")}`;
}
function getProductImages(product) {
  const rawImages = [
    ...(Array.isArray(product?.images)
      ? product.images
      : product?.images
      ? [product.images]
      : []),
    product?.image,
    product?.imageUrl,
    product?.productImage,
  ];
  return [
    ...new Set(rawImages.map(getImageUrl).filter(Boolean)),
  ];
}
// ==========================================
// RATING COMPONENT
// ==========================================
function StarRating({ rating, size = 22 }) {
  const value = Math.max(
    0,
    Math.min(5, Number(rating) || 0)
  );
  return (
    <span
      style={{
        color: "#f59e0b",
        fontSize: size,
        letterSpacing: "2px",
      }}
      aria-label={`${value} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star}>
          {star <= Math.round(value) ? "★" : "☆"}
        </span>
      ))}
    </span>
  );
}
// ==========================================
// REVIEW HELPERS
// ==========================================
function extractReviews(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.reviews)) return data.reviews;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}
function getReviewProductId(review) {
  const value = review?.product || review?.productId;
  if (value && typeof value === "object") {
    return value._id || value.id;
  }
  return value;
}
// ==========================================
// PRODUCT DETAILS COMPONENT
// ==========================================
function ProductDetails() {
  const { id, productId } = useParams();
  const navigate = useNavigate();
  const currentId = productId || id;
  // PRODUCT STATE
  const [product, setProduct] = useState(null);
  const [images, setImages] = useState([]);
  const [activeImage, setActiveImage] = useState("");
  const [imageFailed, setImageFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // REVIEWS STATE
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState("");
  // REVIEW FORM STATE
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewError, setReviewError] = useState("");
  // REPORT PRODUCT STATE
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");
  const [reportSuccess, setReportSuccess] = useState("");


  const handleReportSubmit = async (event) => {
    event.preventDefault();
    setReportError("");
    setReportSuccess("");


    const currentToken = localStorage.getItem("token");
    if (!currentToken) {
      setReportError("Please login to report this product.");
      navigate("/login");
      return;
    }
    if (!reportReason) {
      setReportError("Please select a reason.");
      return;
    }


    try {
      setReportLoading(true);
      await axios.post(
        `${API_URL}/reports`,
        {
          reportedProduct: currentId,
          reason: reportReason,
          description: reportDescription.trim(),
        },
        { headers: { Authorization: `Bearer ${currentToken}` } }
      );
      setReportSuccess("Report submitted successfully. Our admin team will review it.");
      setReportReason("");
      setReportDescription("");
      setShowReportForm(false);
    } catch (err) {
      setReportError(
        err.response?.data?.message ||
        "Could not submit the report. Please try again."
      );
    } finally {
      setReportLoading(false);
    }
  };


  const token = localStorage.getItem("token");
  // ==========================================
  // FETCH PRODUCT DETAILS
  // ==========================================
  useEffect(() => {
    let active = true;
    async function fetchProduct() {
      if (!currentId) {
        setError("Product ID is missing.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError("");
        const response = await axios.get(
          `${API_URL}/products/${currentId}`
        );
        const data = response.data;
        const item = data.product || data.data || data;
        if (!active) return;
        if (
          !item ||
          typeof item !== "object" ||
          Array.isArray(item)
        ) {
          throw new Error("Invalid product data.");
        }
        const productImages = getProductImages(item);
        setProduct(item);
        setImages(productImages);
        setActiveImage(productImages[0] || "");
        setImageFailed(false);
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
            err.message ||
            "Unable to load product details."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchProduct();
    return () => {
      active = false;
    };
  }, [currentId]);
  // ==========================================
  // FETCH PRODUCT REVIEWS
  // ==========================================
  const fetchReviews = async () => {
    if (!currentId) return;
    try {
      setReviewsLoading(true);
      setReviewsError("");
      const response = await axios.get(
        `${API_URL}/reviews`,
        {
          params: {
            product: currentId,
          },
        }
      );
      const reviewList = extractReviews(response.data);
      const filteredReviews = reviewList.filter(
        (review) =>
          String(getReviewProductId(review)) ===
          String(currentId)
      );
      setReviews(filteredReviews);
    } catch (err) {
      setReviewsError(
        err.response?.data?.message ||
        "Unable to load reviews."
      );
    } finally {
      setReviewsLoading(false);
    }
  };
  useEffect(() => {
    fetchReviews();
  }, [currentId]);
  // ==========================================
  // RATING CALCULATIONS
  // ==========================================
  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? reviews.reduce(
          (sum, review) =>
            sum + (Number(review.rating) || 0),
          0
        ) / totalReviews
      : 0;
  const ratingCounts = [5, 4, 3, 2, 1].map(
    (star) => ({
      star,
      count: reviews.filter(
        (review) => Number(review.rating) === star
      ).length,
    })
  );
  // ==========================================
  // PRODUCT INFORMATION
  // ==========================================
  const price =
    product?.price ??
    product?.rentPrice ??
    product?.amount;
  const sellerData =
    product?.sellerId ||
    product?.seller ||
    product?.owner;
  const sellerId =
    typeof sellerData === "object" &&
    sellerData !== null
      ? sellerData._id || sellerData.id
      : sellerData;
  const seller =
    (typeof sellerData === "object" &&
    sellerData !== null
      ? sellerData.fullName || sellerData.name
      : null) ||
    product?.sellerName ||
    "Seller information unavailable";
  const college =
    product?.college ||
    (typeof sellerData === "object" &&
    sellerData !== null
      ? sellerData.college ||
        sellerData.collegeName ||
        sellerData.collegeId
      : null);
  const hasSeller = Boolean(sellerId);
  const isOutOfStock =
    product?.stock != null &&
    Number(product.stock) <= 0;
  const validPrice =
    price != null &&
    Number.isFinite(Number(price)) &&
    Number(price) > 0;
  // ==========================================
  // BARGAIN BUTTON
  // ==========================================
  const handleBargain = () => {
    if (!product || !currentId) {
      alert("Product information is unavailable.");
      return;
    }
    if (!localStorage.getItem("token")) {
      alert("Please login to bargain.");
      navigate("/login");
      return;
    }
    if (!hasSeller) {
      alert("This product does not have a seller assigned. Please contact the administrator.");
      return;
    }
    navigate(`/bargain?productId=${encodeURIComponent(currentId)}`, {
      state: {
        product: { ...product, _id: product._id || currentId },
        productId: currentId,
        sellerId,
      },
    });
  };
  // ==========================================
  // BUY NOW BUTTON - UPDATED
  // ==========================================
  const handleBuyNow = () => {
    if (!product || !currentId) {
      alert("Product information is unavailable.");
      return;
    }
    // Check login
    const currentToken = localStorage.getItem("token");
    if (!currentToken) {
      alert("Please login to buy this product.");
      navigate("/login");
      return;
    }
    // Check seller
    if (!hasSeller) {
      alert(
        "Seller information is missing. " +
        "Unable to place an order for this product."
      );
      return;
    }
    // Check stock
    if (isOutOfStock) {
      alert("This product is out of stock.");
      return;
    }
    // Check price
    if (!validPrice) {
      alert("A valid product price is required.");
      return;
    }
    // Product information for Meet Point page
    const selectedProduct = {
      ...product,
      _id: product._id || currentId,
    };
    // Navigate to Meet Point
    // Do NOT create the order here
    navigate("/meetpoint", {
      state: {
        source: "buy",
        product: selectedProduct,
        productId: selectedProduct._id,
        sellerId: sellerId,
        sellerName: seller,
        productName:
          product.name ||
          product.title ||
          "Product",
        price: Number(price),
        quantity: 1,
        image: images[0] || "",
      },
    });
  };
  // ==========================================
  // SUBMIT REVIEW
  // ==========================================
  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    setReviewMessage("");
    setReviewError("");
    const currentToken = localStorage.getItem("token");
    if (!currentToken) {
      setReviewError(
        "Please log in to submit a review."
      );
      return;
    }
    if (!comment.trim()) {
      setReviewError("Please write your review.");
      return;
    }
    if (rating < 1 || rating > 5) {
      setReviewError("Select a valid rating.");
      return;
    }
    try {
      setReviewLoading(true);
      const response = await axios.post(
        `${API_URL}/reviews`,
        {
          product: currentId,
          rating: Number(rating),
          comment: comment.trim(),
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
          "Review submission failed."
        );
      }
      setReviewMessage(
        response.data?.message ||
        "Review submitted successfully."
      );
      setComment("");
      setRating(5);
      await fetchReviews();
    } catch (err) {
      setReviewError(
        err.response?.data?.message ||
        err.message ||
        "Unable to submit review."
      );
    } finally {
      setReviewLoading(false);
    }
  };
  // ==========================================
  // LOADING
  // ==========================================
  if (loading) {
    return (
      <div className="product-details-message">
        Loading product details...
      </div>
    );
  }
  // ==========================================
  // ERROR
  // ==========================================
  if (error || !product) {
    return (
      <div className="product-details-page">
        <button
          type="button"
          className="pd-back-btn"
          onClick={() => navigate("/products")}
        >
          ← Back to Marketplace
        </button>
        <div className="product-details-message">
          {error || "Product not found."}
        </div>
      </div>
    );
  }
  // ==========================================
  // PRODUCT DETAILS PAGE
  // ==========================================
  return (
    <div className="product-details-page">
      {/* HEADER */}
      <header className="pd-header">
        <button
          type="button"
          className="pd-back-btn"
          onClick={() => navigate("/products")}
        >
          ← Back
        </button>
        <h2>C-Mart</h2>
        <span className="pd-header-label">
          Product Details
        </span>
      </header>
      <main className="pd-container">
        {/* PRODUCT IMAGE GALLERY */}
        <div className="pd-image-section">
          <div className="pd-image-frame">
            {activeImage && !imageFailed ? (
              <img
                src={activeImage}
                alt={
                  product.name ||
                  product.title ||
                  "Product"
                }
                className="pd-product-image"
                onError={() => setImageFailed(true)}
              />
            ) : (
              <div className="pd-no-image">
                📦 No Image Available
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="pd-thumbnails">
              {images.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  className={`pd-thumbnail ${
                    activeImage === image
                      ? "active"
                      : ""
                  }`}
                  onClick={() => {
                    setActiveImage(image);
                    setImageFailed(false);
                  }}
                >
                  <img
                    src={image}
                    alt={`Product view ${index + 1}`}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
        {/* PRODUCT INFORMATION */}
        <section className="pd-info-section">
          <span className="pd-category">
            {product.category || "General"}
          </span>
          <h1>
            {product.name ||
              product.title ||
              "Untitled Product"}
          </h1>
          <div className="pd-rating-summary">
            {totalReviews > 0 ? (
              <>
                <StarRating rating={averageRating} />
                <strong>
                  {averageRating.toFixed(1)} / 5
                </strong>
                <span>
                  ({totalReviews} reviews)
                </span>
              </>
            ) : (
              <span>No ratings yet</span>
            )}
          </div>
          <p className="pd-price">
            {price != null &&
            Number.isFinite(Number(price))
              ? `₹${Number(price).toLocaleString(
                  "en-IN"
                )}`
              : "Price not available"}
          </p>
          <p className="pd-condition">
            <strong>Condition:</strong>{" "}
            {product.condition || "Not specified"}
          </p>
          {product.brand && (
            <p className="pd-condition">
              <strong>Brand:</strong> {product.brand}
            </p>
          )}
          {product.stock != null && (
            <p className="pd-condition">
              <strong>Stock:</strong> {product.stock}
            </p>
          )}
          <div className="pd-divider" />
          {/* DESCRIPTION */}
          <h3>Description</h3>
          <p className="pd-description">
            {product.description ||
              "No description available."}
          </p>
          <div className="pd-divider" />
          {/* SELLER INFORMATION */}
          <h3>Seller Information</h3>
          <p className="pd-seller">
            <strong>Seller:</strong> {seller}
          </p>
          {college && (
            <p className="pd-seller">
              <strong>College:</strong> {college}
            </p>
          )}
          {product.location && (
            <p className="pd-seller">
              <strong>Location:</strong>{" "}
              {product.location}
            </p>
          )}
          {!hasSeller && (
            <p
              style={{
                color: "#b45309",
                fontWeight: 600,
                marginTop: 12,
              }}
            >
              Seller information is missing for this
              product. Buying and bargaining are unavailable.
            </p>
          )}
          {/* ACTION BUTTONS */}
          <div className="pd-actions">
            <button
              type="button"
              className="pd-buy-btn"
              onClick={handleBuyNow}
              disabled={isOutOfStock}
            >
              {isOutOfStock
                ? "Out of Stock"
                : "Buy Now"}
            </button>
            <button
              type="button"
              className="pd-bargain-btn"
              onClick={handleBargain}
              disabled={!hasSeller}
              title={
                hasSeller
                  ? "Negotiate price with seller"
                  : "Seller information unavailable"
              }
              style={{
                opacity: hasSeller ? 1 : 0.5,
                cursor: hasSeller
                  ? "pointer"
                  : "not-allowed",
              }}
            >
              🤝 Bargain
            </button>
              <button
              type="button"
                onClick={() => {
                  setReportError("");
                  setReportSuccess("");
                  if (!localStorage.getItem("token")) {
                    navigate("/login");
                    return;
                  }
                  setShowReportForm((open) => !open);
                }}
                style={{
                  background: "#dc2626",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "12px 20px",
                  cursor: "pointer",
                }}
              >
                🚩 Report Product
              </button>


            <button
              type="button"
              className="pd-home-btn"
              onClick={() => navigate("/")}
            >
              Back to Dashboard
            </button>
            </div>


            {reportSuccess && (
              <p role="status" style={{ color: "#15803d", marginTop: 14 }}>
                {reportSuccess}
              </p>
            )}


            {showReportForm && (
              <form
                onSubmit={handleReportSubmit}
                style={{
                  marginTop: 20,
                  padding: 20,
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  background: "#fff",
                  display: "grid",
                  gap: 12,
                }}
              >
                <h3>Report this product</h3>
                <label htmlFor="pd-report-reason">Reason for reporting</label>
                <select
                  id="pd-report-reason"
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  required
                  style={{ padding: 12, borderRadius: 8 }}
                >
                  <option value="">Select a reason</option>
                  <option value="Fake Product">Fake Product</option>
                  <option value="Wrong Information">Wrong Information</option>
                  <option value="Inappropriate Content">Inappropriate Content</option>
                  <option value="Fraud or Scam">Fraud or Scam</option>
                  <option value="Other">Other</option>
                </select>
                <label htmlFor="pd-report-description">Description (optional)</label>
                <textarea
                  id="pd-report-description"
                  rows={4}
                  maxLength={1000}
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Explain what is wrong with this product..."
                  style={{ padding: 12, borderRadius: 8 }}
                />
                {reportError && <p role="alert" style={{ color: "#b91c1c" }}>{reportError}</p>}
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <button type="submit" disabled={reportLoading}>
                    {reportLoading ? "Submitting..." : "Submit Report"}
                  </button>
                  <button type="button" onClick={() => setShowReportForm(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </section>
        </main>
      {/* ======================================
          RATINGS AND REVIEWS
      ====================================== */}
      <section className="pd-reviews-section">
        <div className="pd-reviews-header">
          <h2>⭐ Customer Ratings & Reviews</h2>
          <p>
            See what students say about this product.
          </p>
        </div>
        {/* RATING OVERVIEW */}
        <div className="pd-rating-overview">
          <div className="pd-rating-score">
            <h2>
              {averageRating.toFixed(1)}
              <span> / 5</span>
            </h2>
            <StarRating
              rating={averageRating}
              size={28}
            />
            <p>
              {totalReviews} customer{" "}
              {totalReviews === 1
                ? "review"
                : "reviews"}
            </p>
          </div>
          <div className="pd-rating-bars">
            {ratingCounts.map(({ star, count }) => {
              const percentage =
                totalReviews > 0
                  ? (count / totalReviews) * 100
                  : 0;
              return (
                <div
                  className="pd-rating-bar-row"
                  key={star}
                >
                  <span>{star} ★</span>
                  <div className="pd-rating-bar-track">
                    <div
                      className="pd-rating-bar-fill"
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>
                  <span>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="pd-divider" />
        {/* REVIEW FORM */}
        <h3>Write a Review</h3>
        {!token ? (
          <p>
            Please{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
            >
              log in
            </button>{" "}
            to submit a review.
          </p>
        ) : (
          <form
            className="pd-review-form"
            onSubmit={handleReviewSubmit}
          >
            <label>Your Rating</label>
            <div className="pd-star-picker">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={
                    star <= rating
                      ? "pd-star-button selected"
                      : "pd-star-button"
                  }
                  onClick={() => setRating(star)}
                  aria-label={`Rate ${star} out of 5 stars`}
                  aria-pressed={rating === star}
                >
                  ★
                </button>
              ))}
            </div>
            <label htmlFor="pd-comment">
              Your Review
            </label>
            <textarea
              id="pd-comment"
              value={comment}
              onChange={(event) =>
                setComment(event.target.value)
              }
              placeholder="Share your experience with this product..."
              rows={4}
              maxLength={1000}
              required
            />
            <button
              type="submit"
              className="pd-submit-review-btn"
              disabled={reviewLoading}
            >
              {reviewLoading
                ? "Submitting..."
                : "Submit Review"}
            </button>
          </form>
        )}
        {reviewMessage && (
          <p className="pd-review-success">
            {reviewMessage}
          </p>
        )}
        {reviewError && (
          <p className="pd-review-error">
            {reviewError}
          </p>
        )}
        <div className="pd-divider" />
        {/* REVIEWS LIST */}
        <div className="pd-reviews-list">
          <h3>
            Student Reviews ({totalReviews})
          </h3>
          {reviewsLoading ? (
            <p>Loading reviews...</p>
          ) : reviewsError ? (
            <p className="pd-review-error">
              {reviewsError}
            </p>
          ) : totalReviews === 0 ? (
            <div className="pd-no-reviews">
              <p>⭐ No reviews yet.</p>
              <p>
                Be the first to share your
                experience with this product.
              </p>
            </div>
          ) : (
            <div className="pd-review-list">
              {reviews.map((review, index) => (
                <article
                  className="pd-review-card"
                  key={review._id || index}
                >
                  <div className="pd-review-top">
                    <div className="pd-review-avatar">
                      👤
                    </div>
                    <div>
                      <strong>
                        {review.user?.fullName ||
                          review.user?.name ||
                          "C-Mart Student"}
                      </strong>
                      <p>
                        {review.createdAt
                          ? new Date(
                              review.createdAt
                            ).toLocaleDateString(
                              "en-IN"
                            )
                          : ""}
                      </p>
                    </div>
                  </div>
                  <StarRating
                    rating={review.rating}
                    size={20}
                  />
                  <p className="pd-review-comment">
                    {review.comment}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
export default ProductDetails;
