const Review = require("../models/Review");

// Create a new review
const createReview = async (req, res) => {
  try {
    const { rating, comment, user, product } = req.body;

    const review = new Review({
      rating,
      comment,
      user,
      product,
    });

    const savedReview = await review.save();

    res.status(201).json(savedReview);
  } catch (error) {
    res.status(500).json({
      message: "Failed to create review",
      error: error.message,
    });
  }
};

// Get all reviews
const getReviews = async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get reviews",
      error: error.message,
    });
  }
};

module.exports = {
  createReview,
  getReviews,
};