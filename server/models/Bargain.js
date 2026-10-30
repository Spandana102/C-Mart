
const mongoose = require("mongoose");

const bargainSchema = new mongoose.Schema(
  {
    // Product for which buyer submitted an offer
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product ID is required"],
      index: true,
    },

    // Buyer who submitted the offer
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Buyer ID is required"],
      index: true,
    },

    // Seller who owns the product
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Seller ID is required"],
      index: true,
    },

    // Buyer's proposed price
    offerPrice: {
      type: Number,
      required: [true, "Offer price is required"],
      min: [0.01, "Offer price must be greater than zero"],
    },

    // Optional message from buyer
    message: {
      type: String,
      default: "",
      trim: true,
      maxlength: [300, "Message cannot exceed 300 characters"],
    },

    // Current bargaining status
    status: {
      type: String,
      enum: [
        "Pending",
        "Accepted",
        "Rejected",
        "Countered",
      ],
      default: "Pending",
      index: true,
    },

    // Seller's counter-offer price
    counterPrice: {
      type: Number,
      default: null,
      min: [0.01, "Counter price must be greater than zero"],
    },
  },
  {
    timestamps: true,
  }
);

// Seller can view latest received offers
bargainSchema.index({
  sellerId: 1,
  createdAt: -1,
});

// Buyer can view submitted offers
bargainSchema.index({
  buyerId: 1,
  createdAt: -1,
});

// Find offers for a particular product
bargainSchema.index({
  productId: 1,
  buyerId: 1,
  status: 1,
});

module.exports = mongoose.model("Bargain", bargainSchema);
