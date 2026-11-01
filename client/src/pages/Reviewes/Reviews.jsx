import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API_URL } from "../../services/apiConfig";
import "./Reviews.css";

const RATING_TEXT = ["Select your rating", "Not satisfied", "Needs improvement", "Good experience", "Very good experience", "Excellent experience! ⭐"];

const normalizeReviews = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.reviews)) return data.reviews;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const getStoredUser = () => {
  try { return JSON.parse(localStorage.getItem("user") || "null"); }
  catch { return null; }
};

function Reviews() {
  const location = useLocation();
  const navigate = useNavigate();
  const productId = typeof location.state?.productId === "string"
    ? location.state.productId
    : location.state?.productId?._id || "";
  const productName = location.state?.productName || "";
  const orderId = location.state?.orderId || "";

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState("");
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingReviews, setFetchingReviews] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [listError, setListError] = useState("");

  const user = getStoredUser();
  const token = localStorage.getItem("token");

  const fetchReviews = useCallback(async () => {
    setFetchingReviews(true);
    setListError("");
    try {
      const url = productId
        ? `${API_URL}/reviews?product=${encodeURIComponent(productId)}`
        : `${API_URL}/reviews`;
      const response = await fetch(url);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Failed to load reviews.");
      const items = normalizeReviews(data);
      const matching = productId
        ? items.filter((item) => {
            const id = item.product?._id || item.product;
            return !id || String(id) === String(productId);
          })
        : items;
      setReviews(matching);
    } catch (err) {
      setListError(err.message || "Unable to load reviews.");
      setReviews([]);
    } finally {
      setFetchingReviews(false);
    }
  }, [productId]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;
    setError("");
    setSuccess("");

    if (!productId || !orderId) {
      setError("Open Rate & Review from a delivered order in My Purchases.");
      return;
    }
    if (!token) {
      setError("Please log in to submit your review.");
      navigate("/login");
      return;
    }
    if (rating < 1 || rating > 5) {
      setError("Please select a star rating from 1 to 5.");
      return;
    }
    if (!review.trim()) {
      setError("Please write your review.");
      return;
    }

    setLoading(true);
    try {
      // Preserve existing API fields; orderId enables delivered-order validation
      // when the backend supports it. Identity must be verified from the JWT server-side.
      const payload = {
        rating,
        comment: review.trim(),
        product: productId,
        orderId,
        ...(user?._id ? { user: user._id } : {}),
      };
      const response = await fetch(`${API_URL}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Failed to publish review.");
      }
      setRating(0);
      setHoverRating(0);
      setReview("");
      setSuccess("Your review was submitted successfully!");
      await fetchReviews();
    } catch (err) {
      setError(err.message || "Unable to publish review. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const totalReviews = reviews.length;
  const averageRating = useMemo(() => totalReviews
    ? (reviews.reduce((sum, item) => sum + (Number(item.rating) || 0), 0) / totalReviews).toFixed(1)
    : "0.0", [reviews, totalReviews]);
  const getRatingCount = (star) => reviews.filter((item) => Number(item.rating) === star).length;
  const getRatingPercentage = (star) => totalReviews ? Math.round(getRatingCount(star) / totalReviews * 100) : 0;
  const displayedRating = hoverRating || rating;
  const scrollToReviewForm = () => document.getElementById("write-review")?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="reviews-page">
      <section className="reviews-hero">
        <div className="hero-content">
          <div className="hero-badge">⭐ TRUSTED BY STUDENTS</div>
          <h1>Your Voice.<br /><span>Our Community.</span></h1>
          <p>{productName
            ? `Share your experience with ${productName} and help fellow students.`
            : "Explore student feedback and help fellow students discover better products."}</p>
          <button type="button" className="hero-review-btn" onClick={scrollToReviewForm}>Write a Review →</button>
        </div>
        <div className="hero-rating-card">
          <span className="rating-card-label">{productName ? "PRODUCT RATING" : "C-MART RATING"}</span>
          <div className="hero-rating-number">{averageRating}<small>/5</small></div>
          <div className="hero-stars">{"★".repeat(Math.round(Number(averageRating)))}{"☆".repeat(5 - Math.round(Number(averageRating)))}</div>
          <p>Based on {totalReviews} {totalReviews === 1 ? "student review" : "student reviews"}</p>
        </div>
      </section>

      {productName && <div style={{ textAlign: "center", padding: 20, background: "#fff" }}>
        <h2>{productName}</h2><p>Student reviews for this product</p>
      </div>}

      <main className="reviews-main">
        <section className="rating-summary">
          <div className="summary-title">
            <span>COMMUNITY FEEDBACK</span>
            <h2>What students are saying</h2>
            <p>Feedback from C-Mart students.</p>
          </div>
          <div className="rating-overview">
            <div className="overall-rating">
              <strong>{averageRating}</strong>
              <div className="overall-stars">{"★".repeat(Math.round(Number(averageRating)))}{"☆".repeat(5 - Math.round(Number(averageRating)))}</div>
              <span>{totalReviews} total {totalReviews === 1 ? "review" : "reviews"}</span>
            </div>
            <div className="rating-bars">
              {[5, 4, 3, 2, 1].map((star) => <div className="rating-bar-row" key={star}>
                <span>{star} ★</span>
                <div className="rating-bar"><div className="rating-bar-fill" style={{ width: `${getRatingPercentage(star)}%` }} /></div>
                <span>{getRatingCount(star)}</span>
              </div>)}
            </div>
          </div>
        </section>

        <section className="write-review-card" id="write-review">
          <div className="write-review-header">
            <div className="write-icon">✍️</div>
            <div><span>SHARE YOUR EXPERIENCE</span><h2>Write a Review</h2><p>Your feedback helps other students make better decisions.</p></div>
          </div>
          {error && <p role="alert" style={{ color: "#b91c1c", padding: 12, background: "#fef2f2", borderRadius: 8 }}>{error}</p>}
          {success && <p role="status" style={{ color: "#166534", padding: 12, background: "#f0fdf4", borderRadius: 8 }}>{success}</p>}
          {!productId || !orderId ? (
            <div style={{ padding: 20, background: "#fef3c7", borderRadius: 10, marginTop: 20 }}>
              ⭐ To submit a review, open <strong>My Purchases → Delivered Order → Rate & Review</strong>.
              <div style={{ marginTop: 12 }}><button type="button" onClick={() => navigate("/orders")}>Go to My Orders →</button></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label>How would you rate this product?</label>
              <div className="interactive-stars" role="group" aria-label="Product rating">
                {[1, 2, 3, 4, 5].map((star) => <button
                  type="button" key={star} aria-label={`${star} star${star > 1 ? "s" : ""}`}
                  aria-pressed={rating === star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onFocus={() => setHoverRating(star)}
                  onBlur={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className={star <= displayedRating ? "active" : ""}
                >{star <= displayedRating ? "★" : "☆"}</button>)}
              </div>
              <div className="rating-message">{RATING_TEXT[displayedRating]}</div>
              <label htmlFor="review-comment">Your Review</label>
              <textarea id="review-comment" value={review} onChange={(event) => setReview(event.target.value)}
                placeholder="Tell us about your experience with this product..." maxLength={500} rows={6} />
              <div className="review-form-footer">
                <span>{review.length}/500 characters</span>
                <button type="submit" disabled={loading}>{loading ? "Publishing..." : "Publish Review →"}</button>
              </div>
            </form>
          )}
        </section>

        <section className="student-reviews-section">
          <div className="reviews-section-heading">
            <div><span>COMMUNITY</span><h2>Student Reviews</h2><p>Feedback from C-Mart members.</p></div>
            <strong>{totalReviews} {totalReviews === 1 ? "Review" : "Reviews"}</strong>
          </div>
          {listError && <p role="alert" style={{ color: "#b91c1c" }}>{listError} <button type="button" onClick={fetchReviews}>Retry</button></p>}
          {fetchingReviews ? <div className="empty-reviews"><h3>Loading reviews...</h3></div>
            : reviews.length === 0 ? <div className="empty-reviews">
              <div className="empty-review-icon">💬</div>
              <h3>No reviews yet</h3>
              <p>No student reviews have been published for this {productId ? "product" : "community"} yet.</p>
              {productId && orderId && <button type="button" onClick={scrollToReviewForm}>Write First Review →</button>}
            </div> : <div className="review-grid">
              {reviews.map((item, index) => {
                const itemRating = Math.min(5, Math.max(0, Math.round(Number(item.rating) || 0)));
                const reviewerName = item.user?.fullName || item.user?.name || "C-Mart Student";
                return <article className="review-card" key={item._id || index}>
                  <div className="review-card-top">
                    <div className="student-profile">
                      <div className="student-avatar">{reviewerName.charAt(0).toUpperCase()}</div>
                      <div><h3>{reviewerName}</h3><span>C-Mart Member</span></div>
                    </div>
                    <div className="review-date">⭐</div>
                  </div>
                  <div className="review-card-rating"><div>{"★".repeat(itemRating)}{"☆".repeat(5 - itemRating)}</div><span>{itemRating}/5</span></div>
                  <p className="review-comment">“{item.comment || ""}”</p>
                  <div className="review-card-tag">🛍️ Product Review</div>
                </article>;
              })}
            </div>}
        </section>
      </main>
      <footer className="reviews-footer"><div className="footer-logo">🛍️ C-Mart</div><p>Campus Marketplace • Buy • Sell • Swap • Rent • Bargain • Reviews</p></footer>
    </div>
  );
}

export default Reviews;
