
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import "./ProductDetails.css";

const API_URL = "http://localhost:5000/api";
const SERVER_URL = "http://localhost:5000";

// Convert image values into valid URLs
function getImageUrl(image) {
  if (!image) return "";

  if (Array.isArray(image)) {
    for (const item of image) {
      const url = getImageUrl(item);
      if (url) return url;
    }
    return "";
  }

  if (typeof image === "object") {
    return getImageUrl(
      image.secure_url ||
      image.url ||
      image.imageUrl ||
      image.path ||
      image.src ||
      ""
    );
  }

  if (typeof image !== "string") return "";

  const value = image.trim().replace(/\\/g, "/");

  if (!value) return "";

  if (
    /^https?:\/\//i.test(value) ||
    value.startsWith("data:image/") ||
    value.startsWith("blob:")
  ) {
    return value;
  }

  if (value.startsWith("//")) {
    return `https:${value}`;
  }

  return `${SERVER_URL}/${value.replace(/^\/+/, "")}`;
}

// Collect all product images
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

// Star rating component
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

function extractReviews(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.reviews)) return data.reviews;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function ProductDetails() {
  const { id, productId } = useParams();
  const navigate = useNavigate();
  const currentId = productId || id;

  const [product, setProduct] = useState(null);
  const [images, setImages] = useState([]);
  const [activeImage, setActiveImage] = useState("");
  const [imageFailed, setImageFailed] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Reviews
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] =
    useState(true);
  const [reviewsError, setReviewsError] = useState("");

  // Review form
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewLoading, setReviewLoading] =
    useState(false);
  const [reviewMessage, setReviewMessage] =
    useState("");
  const [reviewError, setReviewError] =
    useState("");

  const token = localStorage.getItem("token");

  // Fetch product details
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

        if (!item || Array.isArray(item)) {
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

  // Fetch reviews for selected product
  useEffect(() => {
    let active = true;

    async function fetchReviews() {
      if (!currentId) {
        setReviewsLoading(false);
        return;
      }

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

        if (!active) return;

        const reviewList = extractReviews(
          response.data
        );

        // Keep reviews belonging to this product
        const filteredReviews = reviewList.filter(
          (review) => {
            const reviewProduct =
              review.product?._id ||
              review.product ||
              review.productId?._id ||
              review.productId;

            return (
              String(reviewProduct) ===
              String(currentId)
            );
          }
        );

        setReviews(filteredReviews);
      } catch (err) {
        if (active) {
          setReviewsError(
            err.response?.data?.message ||
            "Unable to load reviews."
          );
        }
      } finally {
        if (active) setReviewsLoading(false);
      }
    }

    fetchReviews();

    return () => {
      active = false;
    };
  }, [currentId]);

  // Rating calculations
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
        (review) =>
          Number(review.rating) === star
      ).length,
    })
  );

  // Product details
  const price =
    product?.price ??
    product?.rentPrice ??
    product?.amount;

  const sellerData =
    product?.sellerId ||
    product?.seller ||
    product?.owner;

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
        sellerData.collegeName
      : null);

  // Bargaining for selected product
  const handleBargain = () => {
    if (!product || !currentId) return;

    navigate(`/bargaining/${currentId}`, {
      state: {
        product: {
          ...product,
          _id: product._id || currentId,
        },
      },
    });
  };

  // Buy Now -> Meet Point
  const handleBuyNow = () => {
    if (!product || !currentId) return;

    navigate("/meetpoint", {
      state: {
        product: {
          ...product,
          _id: product._id || currentId,
        },
        productId: currentId,
        source: "buy",
      },
    });
  };

  // Submit review
  const handleReviewSubmit = async (event) => {
    event.preventDefault();

    setReviewMessage("");
    setReviewError("");

    if (!token) {
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
            Authorization: `Bearer ${token}`,
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

      // Refresh reviews
      const refreshed = await axios.get(
        `${API_URL}/reviews`,
        {
          params: { product: currentId },
        }
      );

      const refreshedReviews = extractReviews(
        refreshed.data
      );

      setReviews(
        refreshedReviews.filter((review) => {
          const reviewProduct =
            review.product?._id ||
            review.product ||
            review.productId?._id ||
            review.productId;

          return (
            String(reviewProduct) ===
            String(currentId)
          );
        })
      );
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

  if (loading) {
    return (
      <div className="product-details-message">
        Loading product details...
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-details-page">
        <button
          type="button"
          className="pd-back-btn"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>

        <div className="product-details-message">
          {error || "Product not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="product-details-page">
      {/* Header */}
      <header className="pd-header">
        <button
          type="button"
          className="pd-back-btn"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>

        <h2>C-Mart</h2>

        <span className="pd-header-label">
          Product Details
        </span>
      </header>

      <main className="pd-container">
        {/* Product Gallery */}
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
                onError={() =>
                  setImageFailed(true)
                }
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

        {/* Product Information */}
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
                <StarRating
                  rating={averageRating}
                />

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
            {product.condition ||
              "Not specified"}
          </p>

          <div className="pd-divider" />

          <h3>Description</h3>

          <p className="pd-description">
            {product.description ||
              "No description available."}
          </p>

          <div className="pd-divider" />

          <h3>Seller Information</h3>

          <p className="pd-seller">
            <strong>Seller:</strong>{" "}
            {seller}
          </p>

          {college && (
            <p className="pd-seller">
              <strong>College:</strong>{" "}
              {college}
            </p>
          )}

          {product.location && (
            <p className="pd-seller">
              <strong>Location:</strong>{" "}
              {product.location}
            </p>
          )}

          {/* Actions */}
          <div className="pd-actions">
            <button
              type="button"
              className="pd-buy-btn"
              onClick={handleBuyNow}
            >
              Buy Now
            </button>

            <button
              type="button"
              className="pd-bargain-btn"
              onClick={handleBargain}
            >
              Bargain
            </button>

            <button
              type="button"
              className="pd-home-btn"
              onClick={() => navigate("/")}
            >
              Back to Dashboard
            </button>
          </div>
        </section>
      </main>

      {/* Ratings and Reviews */}
      <section className="pd-reviews-section">
        <div className="pd-reviews-header">
          <h2>⭐ Customer Ratings & Reviews</h2>
          <p>
            See what students say about this product.
          </p>
        </div>

        {/* Rating Overview */}
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

        {/* Review Form */}
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

        {/* Reviews List */}
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
