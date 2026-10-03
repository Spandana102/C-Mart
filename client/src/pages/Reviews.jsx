import React, { useEffect, useState } from "react";

function Reviews() {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);

  // Get reviews from backend
  useEffect(() => {
    fetch("http://localhost:5000/api/reviews")
      .then((response) => response.json())
      .then((data) => {
        setReviews(data);
      })
      .catch((error) => {
        console.error("Error fetching reviews:", error);
      });
  }, []);

  // Submit review
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      alert("Please give a rating");
      return;
    }

    if (review.trim() === "") {
      alert("Please write a review");
      return;
    }

    setLoading(true);

    const newReview = {
      rating: rating,
      comment: review,
      user: "You",
      product: "CampusBazaar",
    };

    try {
      const response = await fetch("http://localhost:5000/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newReview),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save review");
      }

      // Add saved review to the page
      setReviews([data, ...reviews]);

      setRating(0);
      setReview("");

      alert("Review saved successfully!");
    } catch (error) {
      console.error("Error saving review:", error);
      alert("Failed to save review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Reviews & Ratings</h1>

      <h2>Give Your Rating</h2>

      <div>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
          >
            {star <= rating ? "★" : "☆"}
          </button>
        ))}
      </div>

      <p>Your Rating: {rating} / 5</p>

      <h2>Write a Review</h2>

      <form onSubmit={handleSubmit}>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Write your review here..."
          rows="5"
          cols="40"
        />

        <br />

        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Submit Review"}
        </button>
      </form>

      <hr />

      <h2>Customer Reviews</h2>

      {reviews.length === 0 ? (
        <p>No reviews yet.</p>
      ) : (
        reviews.map((item, index) => (
          <div key={item._id || index}>
            <h3>{item.user}</h3>

            <p>
              {"★".repeat(item.rating)}
              {"☆".repeat(5 - item.rating)}
            </p>

            <p>{item.comment}</p>

            <hr />
          </div>
        ))
      )}
    </div>
  );
}

export default Reviews;