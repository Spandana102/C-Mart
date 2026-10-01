const express = require("express");

const {
  createReview,
  getReviews,
} = require("../controllers/reviewController");

const router = express.Router();

// Create a review
router.post("/", createReview);

// Get all reviews
router.get("/", getReviews);

module.exports = router;