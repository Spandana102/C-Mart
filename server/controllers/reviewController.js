const Review = require("../models/Review");
const Order = require("../models/Order");

// =========================================================
// CREATE A NEW REVIEW
// =========================================================

const createReview = async (req, res) => {
  try {
    const { rating, comment, user, product } = req.body;

    // Check required fields
    if (!rating || !comment || !user || !product) {
      return res.status(400).json({
        message:
          "Rating, comment, user and product are required",
      });
    }

    // Check whether the student purchased this product
    // and the order has been delivered
    const deliveredOrder = await Order.findOne({
      buyer: user,
      product: product,
      status: "Delivered",
    });

    if (!deliveredOrder) {
      return res.status(403).json({
        message:
          "You can review this product only after it has been delivered to you.",
      });
    }

    // Prevent duplicate review
    const existingReview = await Review.findOne({
      user,
      product,
    });

    if (existingReview) {
      return res.status(400).json({
        message:
          "You have already reviewed this product.",
      });
    }

    // Create review
    const review = new Review({
      rating,
      comment,
      user,
      product,
    });

    const savedReview = await review.save();

    // Return populated review
    const populatedReview = await Review.findById(
      savedReview._id
    )
      .populate("user", "fullName")
      .populate("product", "name");

    res.status(201).json({
      message: "Review submitted successfully",
      review: populatedReview,
    });
  } catch (error) {
    console.error("Create review error:", error);

    res.status(500).json({
      message: "Failed to create review",
      error: error.message,
    });
  }
};

// =========================================================
// GET REVIEWS
// =========================================================

const getReviews = async (req, res) => {
  try {
    const { product } = req.query;

    // If product ID is provided,
    // return reviews only for that product
    const filter = product
      ? { product }
      : {};

    const reviews = await Review.find(filter)
      .populate("user", "fullName")
      .populate("product", "name")
      .sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch (error) {
    console.error("Get reviews error:", error);

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