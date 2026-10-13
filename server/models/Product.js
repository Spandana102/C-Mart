
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    mrp: {
      type: Number,
      default: 0,
      min: 0,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    // Product image URLs
    images: {
      type: [String],
      default: [],
    },

    stock: {
      type: Number,
      default: 0,
      min: 0,
    },

    condition: {
      type: String,
      enum: ["New", "Used"],
      default: "Used",
    },

    brand: {
      type: String,
      default: "",
    },

    specifications: {
      type: Map,
      of: String,
      default: {},
    },

    // Product owner - required for new products
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Helpful indexes for marketplace queries
productSchema.index({ category: 1, createdAt: -1 });

module.exports = mongoose.model("Product", productSchema);
