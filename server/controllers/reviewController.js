
const mongoose = require("mongoose");
const Review = require("../models/Review");
const Order = require("../models/Order");

// ================================================
// HELPERS
// ================================================

// Get user ID from verified JWT middleware
const getLoggedInUserId = (req) => {
  return (
    req.user?._id ||
    req.user?.id ||
    req.user?.userId ||
    null
  );
};

// Strict MongoDB ObjectId validation
const isValidId = (id) => {
  return mongoose.isObjectIdOrHexString(id);
};

// ================================================
// CREATE REVIEW
// POST /api/reviews
// Protected route
// ================================================

const createReview = async (req, res) => {
  try {
    // STEP 1: Authenticate buyer
    const userId = getLoggedInUserId(req);

    if (!userId || !isValidId(userId)) {
      return res.status(401).json({
        success: false,
        message: "Please login to submit a review.",
      });
    }

    // STEP 2: Read request body
    const {
      rating,
      comment,
      product,
      orderId,
    } = req.body || {};

    // STEP 3: Validate product ID
    if (!product || !isValidId(product)) {
      return res.status(400).json({
        success: false,
        message: "A valid product ID is required.",
      });
    }

    // STEP 4: Validate rating
    const numericRating = Number(rating);

    if (
      rating === null ||
      rating === undefined ||
      rating === "" ||
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please select a rating between 1 and 5 stars.",
      });
    }

    // STEP 5: Validate review comment
    if (
      typeof comment !== "string" ||
      !comment.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Please write your review.",
      });
    }

    const cleanComment = comment.trim();

    if (cleanComment.length > 500) {
      return res.status(400).json({
        success: false,
        message:
          "Review cannot exceed 500 characters.",
      });
    }

    // STEP 6: Validate optional order ID
    if (
      orderId !== undefined &&
      orderId !== null &&
      orderId !== "" &&
      !isValidId(orderId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    // STEP 7: Find a delivered order
    // Only the actual buyer can review the product
    const orderFilter = {
      buyer: userId,
      product: product,
      status: "Delivered",
    };

    if (orderId) {
      orderFilter._id = orderId;
    }

    const deliveredOrder = await Order.findOne(
      orderFilter
    );

    if (!deliveredOrder) {
      return res.status(403).json({
        success: false,
        message:
          "You can review this product only after it has been delivered to you.",
      });
    }

    // STEP 8: Prevent duplicate review
    // One review per student per product
    const existingReview = await Review.findOne({
      user: userId,
      product: product,
    });

    if (existingReview) {
      return res.status(409).json({
        success: false,
        message:
          "You have already reviewed this product.",
      });
    }

    // STEP 9: Create review
    const savedReview = await Review.create({
      user: userId,
      product: product,
      rating: numericRating,
      comment: cleanComment,
    });

    // STEP 10: Populate reviewer details
    const populatedReview = await Review.findById(
      savedReview._id
    )
      .populate("user", "fullName")
      .populate("product", "name title");

    // STEP 11: Success response
    return res.status(201).json({
      success: true,
      message: "Review submitted successfully.",
      review: populatedReview,
    });

  } catch (error) {
    console.error(
      "Create Review Error:",
      error.message
    );

    // Duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "You have already reviewed this product.",
      });
    }

    // Mongoose validation error
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Invalid MongoDB ID
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid review data.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to submit review. Please try again.",
    });
  }
};

// ================================================
// GET ALL REVIEWS / PRODUCT REVIEWS
// GET /api/reviews
// GET /api/reviews?product=PRODUCT_ID
// Public route
// ================================================

const getReviews = async (req, res) => {
  try {
    const { product } = req.query;

    const filter = {};

    // Filter by product when provided
    if (product !== undefined) {
      if (
        typeof product !== "string" ||
        !isValidId(product)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid product ID.",
        });
      }

      filter.product = product;
    }

    // Fetch reviews
    const reviews = await Review.find(filter)
      .populate("user", "fullName")
      .populate("product", "name title")
      .sort({ createdAt: -1 });

    // Return array for existing frontend compatibility
    return res.status(200).json(reviews);

  } catch (error) {
    console.error(
      "Get Reviews Error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch reviews. Please try again.",
    });
  }
};

// ================================================
// EXPORT CONTROLLERS
// ================================================

module.exports = {
  createReview,
  getReviews,
};
