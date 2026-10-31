
const express = require("express");

const {
  createReview,
  getReviews,
} = require("../controllers/reviewController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// ==============================================
// GET ALL REVIEWS / PRODUCT REVIEWS
// Public route
// GET /api/reviews
// GET /api/reviews?product=PRODUCT_ID
// ==============================================
router.get("/", getReviews);

// ==============================================
// CREATE A REVIEW
// Protected route - Login required
// POST /api/reviews
// ==============================================
router.post("/", authMiddleware, createReview);

module.exports = router;
