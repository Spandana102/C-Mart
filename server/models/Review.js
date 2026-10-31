
const mongoose = require("mongoose");

// ==============================================
// C-MART - REVIEW MODEL
// ==============================================

const reviewSchema = new mongoose.Schema(
  {
    // Student who submitted the review
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Reviewer is required"],
      index: true,
    },

    // Product being reviewed
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required"],
      index: true,
    },

    // Product rating (1 to 5 stars)
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating cannot be less than 1"],
      max: [5, "Rating cannot be greater than 5"],
      validate: {
        validator: Number.isInteger,
        message: "Rating must be a whole number",
      },
    },

    // Student review message
    comment: {
      type: String,
      required: [true, "Review comment is required"],
      trim: true,
      minlength: [1, "Review cannot be empty"],
      maxlength: [500, "Review cannot exceed 500 characters"],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ==============================================
// PREVENT DUPLICATE REVIEWS
// One review per student per product
// ==============================================

reviewSchema.index(
  { user: 1, product: 1 },
  { unique: true }
);

// ==============================================
// INDEX FOR PRODUCT REVIEWS
// ==============================================

reviewSchema.index({
  product: 1,
  createdAt: -1,
});

// ==============================================
// EXPORT MODEL
// ==============================================

module.exports =
  mongoose.models.Review ||
  mongoose.model("Review", reviewSchema);
