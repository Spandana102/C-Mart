import React, { useState } from "react";

function Reviews() {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [reviews, setReviews] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (rating === 0) {
      alert("Please give a rating");
      return;
    }

    if (review.trim() === "") {
      alert("Please write a review");
      return;
    }

    const newReview = {
      name: "You",
      rating: rating,
      review: review,
    };

    setReviews([...reviews, newReview]);

    setRating(0);
    setReview("");
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

        <button type="submit">
          Submit Review
        </button>
      </form>

      <hr />

      <h2>Customer Reviews</h2>

      {reviews.length === 0 ? (
        <p>No reviews yet.</p>
      ) : (
        reviews.map((item, index) => (
          <div key={index}>
            <h3>{item.name}</h3>

            <p>
              {"★".repeat(item.rating)}
              {"☆".repeat(5 - item.rating)}
            </p>

            <p>{item.review}</p>

            <hr />
          </div>
        ))
      )}
    </div>
  );
}

export default Reviews;