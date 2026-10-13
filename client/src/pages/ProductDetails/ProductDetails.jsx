
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import "./ProductDetails.css";

const API_URL = "http://localhost:5000/api";

function getImageUrl(image) {
  if (!image) return "";

  if (typeof image === "string") {
    if (image.startsWith("http")) return image;

    return "http://localhost:5000/" + image.replace(/^\/+/, "");
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

function ProductDetails() {
  const { id, productId } = useParams();
  const navigate = useNavigate();
  const currentId = productId || id;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewError, setReviewError] = useState("");

  const token = localStorage.getItem("token");

  // Load product details
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
          API_URL + "/products/" + currentId
        );

        const data = response.data;
        const item = data.product || data.data || data;

        if (active) setProduct(item);
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              "Unable to load product details. Please try again."
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

  // Load reviews for this product
  useEffect(() => {
    let active = true;

    async function fetchReviews() {
      if (!currentId) return;

      try {
        setReviewsLoading(true);

        const response = await axios.get(API_URL + "/reviews", {
          params: { product: currentId },
        });

        const data = response.data;
        const list = Array.isArray(data)
          ? data
          : data.reviews || [];

        if (active) setReviews(list);
      } catch (err) {
        console.error(
          "Unable to load reviews:",
          err.response?.data || err.message
        );
      } finally {
        if (active) setReviewsLoading(false);
      }
    }

    fetchReviews();

    return () => {
      active = false;
    };
  }, [currentId]);

  const imageSource = product
    ? getImageUrl(
        product.images?.[0] ||
          product.image ||
          product.imageUrl ||
          product.productImage
      )
    : "";

  const price = product
    ? product.price ?? product.rentPrice ?? product.amount
    : null;

  const seller =
    product?.seller?.fullName ||
    product?.seller?.name ||
    product?.sellerName ||
    product?.owner?.fullName ||
    "Seller information unavailable";

  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce(
            (total, review) => total + Number(review.rating || 0),
            0
          ) / reviews.length
        ).toFixed(1)
      : "0.0";

  const handleBargain = () => {
    if (!product || !currentId) return;

    navigate("/bargaining/" + currentId, {
      state: {
        product: {
          ...product,
          _id: product._id || currentId,
        },
      },
    });
  };

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

  // Submit a product review
  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    setReviewMessage("");
    setReviewError("");

    if (!token) {
      setReviewError("Please log in to submit a review.");
      return;
    }

    if (!comment.trim()) {
      setReviewError("Please write your review.");
      return;
    }

    try {
      setReviewLoading(true);

      const response = await axios.post(
        API_URL + "/reviews",
        {
          product: currentId,
          rating: Number(rating),
          comment: comment.trim(),
        },
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );

      setReviewMessage(
        response.data.message || "Review submitted successfully."
      );
      setComment("");

      // Refresh the reviews list
      const refreshed = await axios.get(API_URL + "/reviews", {
        params: { product: currentId },
      });

      const data = refreshed.data;
      setReviews(
        Array.isArray(data) ? data : data.reviews || []
      );
    } catch (err) {
      setReviewError(
        err.response?.data?.message ||
          "Unable to submit review. Please try again."
      );
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="product-details-page">
        <div className="product-details-message">
          Loading product details...
        </div>
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
      <header className="pd-header">
        <button
          type="button"
          className="pd-back-btn"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>

        <h2>C-Mart</h2>
        <span className="pd-header-label">Product Details</span>
      </header>

      <main className="pd-container">
        <div className="pd-image-section">
          {imageSource ? (
            <img
              src={imageSource}
              alt={product.name || product.title || "Product"}
              className="pd-product-image"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="pd-no-image">No Image Available</div>
          )}
        </div>

        <section className="pd-info-section">
          <span className="pd-category">
            {product.category || "General"}
          </span>

          <h1>{product.name || product.title || "Untitled Product"}</h1>

          <p className="pd-price">
            {price !== null && price !== undefined
              ? "₹" + price
              : "Price not available"}
          </p>

          <p className="pd-condition">
            Condition: {product.condition || "Not specified"}
          </p>

          <div className="pd-divider" />

          <h3>Description</h3>
          <p className="pd-description">
            {product.description || "No description available."}
          </p>

          <div className="pd-divider" />

          <h3>Seller Information</h3>
          <p className="pd-seller">
            <strong>Seller:</strong> {seller}
          </p>

          {product.location && (
            <p className="pd-seller">
              <strong>Location:</strong> {product.location}
            </p>
          )}

          {product.college && (
            <p className="pd-seller">
              <strong>College:</strong> {product.college}
            </p>
          )}

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
        <h2>Ratings &amp; Reviews</h2>

        <div className="pd-rating-summary">
          <span className="pd-average-rating">
            ⭐ {averageRating}/5
          </span>
          <span>
            {reviews.length} review{reviews.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="pd-divider" />

        <h3>Write a Review</h3>

        {!token ? (
          <p>
            Please <button type="button" onClick={() => navigate("/login")}>
              log in
            </button>{" "}
            to submit a review.
          </p>
        ) : (
          <form className="pd-review-form" onSubmit={handleReviewSubmit}>
            <label htmlFor="pd-rating">Your Rating</label>

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
                  aria-label={"Rate " + star + " out of 5 stars"}
                  aria-pressed={rating === star}
                >
                  ★
                </button>
              ))}
            </div>

            <label htmlFor="pd-comment">Your Review</label>
            <textarea
              id="pd-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
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
              {reviewLoading ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        )}

        {reviewMessage && (
          <p className="pd-review-success">{reviewMessage}</p>
        )}

        {reviewError && (
          <p className="pd-review-error">{reviewError}</p>
        )}

        <div className="pd-divider" />

        <h3>Customer Reviews</h3>

        {reviewsLoading ? (
          <p>Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p>No reviews yet for this product.</p>
        ) : (
          <div className="pd-review-list">
            {reviews.map((review) => (
              <article
                className="pd-review-card"
                key={review._id}
              >
                <div className="pd-review-card-header">
                  <strong>
                    {review.user?.fullName ||
                      review.user?.name ||
                      "Student"}
                  </strong>

                  <span className="pd-review-stars">
                    {"★".repeat(
                      Math.max(
                        0,
                        Math.min(5, Number(review.rating) || 0)
                      )
                    )}
                    <span className="pd-empty-stars">
                      {"★".repeat(
                        5 -
                          Math.max(
                            0,
                            Math.min(5, Number(review.rating) || 0)
                          )
                      )}
                    </span>
                  </span>
                </div>

                <p>{review.comment}</p>

                <small>
                  {review.createdAt
                    ? new Date(review.createdAt).toLocaleDateString()
                    : ""}
                </small>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default ProductDetails;
