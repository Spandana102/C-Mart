import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Reviews.css";

function Reviews() {
  const location = useLocation();
  const navigate = useNavigate();

  const productId = location.state?.productId;
  const productName = location.state?.productName;

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState("");
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingReviews, setFetchingReviews] = useState(true);

  // Get logged-in user
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  // Fetch reviews for this product
  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      setFetchingReviews(true);

      const url = productId
        ? `http://localhost:5000/api/reviews?product=${productId}`
        : "http://localhost:5000/api/reviews";

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch reviews");
      }

      const data = await response.json();

      setReviews(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setFetchingReviews(false);
    }
  };

  // Submit review
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!productId) {
      alert(
        "Please open the review option from a delivered order."
      );
      return;
    }

    if (!user?._id) {
      alert("Please login before writing a review.");
      navigate("/login");
      return;
    }

    if (rating === 0) {
      alert("Please select a rating ⭐");
      return;
    }

    if (review.trim() === "") {
      alert("Please write your review ✍️");
      return;
    }

    setLoading(true);

    const newReview = {
      rating,
      comment: review.trim(),
      user: user._id,
      product: productId,
    };

    try {
      const response = await fetch(
        "http://localhost:5000/api/reviews",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newReview),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to save review"
        );
      }

      setReviews((previousReviews) => [
        data.review,
        ...previousReviews,
      ]);

      setRating(0);
      setHoverRating(0);
      setReview("");

      alert("Review published successfully! ⭐");

    } catch (error) {
      console.error("Error saving review:", error);
      alert(error.message || "Failed to save review.");
    } finally {
      setLoading(false);
    }
  };

  const totalReviews = reviews.length;

  const averageRating =
    totalReviews > 0
      ? (
          reviews.reduce(
            (sum, item) =>
              sum + Number(item.rating || 0),
            0
          ) / totalReviews
        ).toFixed(1)
      : "0.0";

  const getRatingCount = (star) => {
    return reviews.filter(
      (item) => Number(item.rating) === star
    ).length;
  };

  const getRatingPercentage = (star) => {
    if (totalReviews === 0) {
      return 0;
    }

    return Math.round(
      (getRatingCount(star) / totalReviews) * 100
    );
  };

  const displayedRating = hoverRating || rating;

  const scrollToReviewForm = () => {
    document
      .getElementById("write-review")
      ?.scrollIntoView({
        behavior: "smooth",
      });
  };

  return (
    <div className="reviews-page">

      {/* HERO SECTION */}
      <section className="reviews-hero">
        <div className="hero-content">

          <div className="hero-badge">
            ⭐ TRUSTED BY STUDENTS
          </div>

          <h1>
            Your Voice.
            <br />
            <span>Our Community.</span>
          </h1>

          <p>
            {productName
              ? `Share your experience with ${productName} and help fellow students.`
              : "Share your C-Mart experience and help fellow students discover better products."}
          </p>

          <button
            className="hero-review-btn"
            onClick={scrollToReviewForm}
          >
            Write a Review →
          </button>

        </div>

        <div className="hero-rating-card">

          <span className="rating-card-label">
            {productName
              ? "PRODUCT RATING"
              : "C-MART RATING"}
          </span>

          <div className="hero-rating-number">
            {averageRating}
            <small>/5</small>
          </div>

          <div className="hero-stars">
            {"★".repeat(
              Math.round(Number(averageRating))
            )}

            {"☆".repeat(
              5 - Math.round(Number(averageRating))
            )}
          </div>

          <p>
            Based on {totalReviews}{" "}
            {totalReviews === 1
              ? "student review"
              : "student reviews"}
          </p>

        </div>
      </section>

      {/* PRODUCT NAME */}
      {productName && (
        <div
          style={{
            textAlign: "center",
            padding: "20px",
            background: "#fff",
          }}
        >
          <h2>{productName}</h2>
          <p>Student reviews for this product</p>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="reviews-main">

        {/* RATING SUMMARY */}
        <section className="rating-summary">

          <div className="summary-title">

            <span>COMMUNITY FEEDBACK</span>

            <h2>
              What students are saying
            </h2>

            <p>
              Real experiences from students who
              purchased this product.
            </p>

          </div>

          <div className="rating-overview">

            <div className="overall-rating">

              <strong>
                {averageRating}
              </strong>

              <div className="overall-stars">

                {"★".repeat(
                  Math.round(Number(averageRating))
                )}

                {"☆".repeat(
                  5 - Math.round(Number(averageRating))
                )}

              </div>

              <span>
                {totalReviews} total{" "}
                {totalReviews === 1
                  ? "review"
                  : "reviews"}
              </span>

            </div>

            <div className="rating-bars">

              {[5, 4, 3, 2, 1].map((star) => (

                <div
                  className="rating-bar-row"
                  key={star}
                >

                  <span>
                    {star} ★
                  </span>

                  <div className="rating-bar">

                    <div
                      className="rating-bar-fill"
                      style={{
                        width:
                          getRatingPercentage(star) +
                          "%",
                      }}
                    />

                  </div>

                  <span>
                    {getRatingCount(star)}
                  </span>

                </div>

              ))}

            </div>

          </div>

        </section>

        {/* WRITE REVIEW */}
        <section
          className="write-review-card"
          id="write-review"
        >

          <div className="write-review-header">

            <div className="write-icon">
              ✍️
            </div>

            <div>

              <span>
                SHARE YOUR EXPERIENCE
              </span>

              <h2>
                Write a Review
              </h2>

              <p>
                Your feedback helps other students
                make better decisions.
              </p>

            </div>

          </div>

          {!productId ? (
            <div
              style={{
                padding: "20px",
                background: "#fef3c7",
                borderRadius: "10px",
                marginTop: "20px",
              }}
            >
              ⭐ Please open this page by clicking
              <strong> Rate & Review </strong>
              from one of your delivered orders.
            </div>
          ) : (
            <form onSubmit={handleSubmit}>

              <label>
                How would you rate this product?
              </label>

              <div className="interactive-stars">

                {[1, 2, 3, 4, 5].map((star) => (

                  <button
                    type="button"
                    key={star}
                    onMouseEnter={() =>
                      setHoverRating(star)
                    }
                    onMouseLeave={() =>
                      setHoverRating(0)
                    }
                    onClick={() =>
                      setRating(star)
                    }
                    className={
                      star <= displayedRating
                        ? "active"
                        : ""
                    }
                  >
                    {star <= displayedRating
                      ? "★"
                      : "☆"}
                  </button>

                ))}

              </div>

              <div className="rating-message">

                {displayedRating === 0 &&
                  "Select your rating"}

                {displayedRating === 1 &&
                  "Not satisfied"}

                {displayedRating === 2 &&
                  "Needs improvement"}

                {displayedRating === 3 &&
                  "Good experience"}

                {displayedRating === 4 &&
                  "Very good experience"}

                {displayedRating === 5 &&
                  "Excellent experience! ⭐"}

              </div>

              <label>
                Your Review
              </label>

              <textarea
                value={review}
                onChange={(e) =>
                  setReview(e.target.value)
                }
                placeholder="Tell us about your experience with this product..."
                maxLength={500}
                rows={6}
              />

              <div className="review-form-footer">

                <span>
                  {review.length}/500 characters
                </span>

                <button
                  type="submit"
                  disabled={loading}
                >
                  {loading
                    ? "Publishing..."
                    : "Publish Review →"}
                </button>

              </div>

            </form>
          )}

        </section>

        {/* STUDENT REVIEWS */}
        <section className="student-reviews-section">

          <div className="reviews-section-heading">

            <div>

              <span>
                COMMUNITY
              </span>

              <h2>
                Student Reviews
              </h2>

              <p>
                Honest feedback from C-Mart members.
              </p>

            </div>

            <strong>
              {totalReviews}{" "}
              {totalReviews === 1
                ? "Review"
                : "Reviews"}
            </strong>

          </div>

          {fetchingReviews ? (

            <div className="empty-reviews">
              <h3>Loading reviews...</h3>
            </div>

          ) : reviews.length === 0 ? (

            <div className="empty-reviews">

              <div className="empty-review-icon">
                💬
              </div>

              <h3>
                No reviews yet
              </h3>

              <p>
                Be the first student to share
                your experience with this product.
              </p>

              {productId && (
                <button
                  onClick={scrollToReviewForm}
                >
                  Write First Review →
                </button>
              )}

            </div>

          ) : (

            <div className="review-grid">

              {reviews.map((item, index) => {

                const itemRating = Math.min(
                  5,
                  Math.max(
                    0,
                    Number(item.rating) || 0
                  )
                );

                const reviewerName =
                  item.user?.fullName ||
                  "C-Mart Student";

                return (

                  <article
                    className="review-card"
                    key={item._id || index}
                  >

                    <div className="review-card-top">

                      <div className="student-profile">

                        <div className="student-avatar">

                          {reviewerName
                            .charAt(0)
                            .toUpperCase()}

                        </div>

                        <div>

                          <h3>
                            {reviewerName}
                          </h3>

                          <span>
                            C-Mart Member
                          </span>

                        </div>

                      </div>

                      <div className="review-date">
                        ⭐
                      </div>

                    </div>

                    <div className="review-card-rating">

                      <div>

                        {"★".repeat(itemRating)}

                        {"☆".repeat(
                          5 - itemRating
                        )}

                      </div>

                      <span>
                        {itemRating}/5
                      </span>

                    </div>

                    <p className="review-comment">
                      “{item.comment}”
                    </p>

                    <div className="review-card-tag">
                      🛍️ Product Review
                    </div>

                  </article>

                );

              })}

            </div>

          )}

        </section>

      </main>

      {/* FOOTER */}
      <footer className="reviews-footer">

        <div className="footer-logo">
          🛍️ C-Mart
        </div>

        <p>
          Campus Marketplace • Buy • Sell • Swap •
          Rent • Bargain • Reviews
        </p>

      </footer>

    </div>
  );
}

export default Reviews;