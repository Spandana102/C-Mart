
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },

    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
    },

    mrp: {
      type: Number,
      default: 0,
      min: 0,
    },

    category: {
      type: String,
      required: [true, "Product category is required"],
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    images: {
      type: [String],
      default: [],
    },

    stock: {
      type: Number,
      default: 1,
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
      trim: true,
    },

    specifications: {
      type: Map,
      of: String,
      default: {},
    },

    // Owner of the product
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Seller ID is required"],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Category filtering
productSchema.index({
  category: 1,
  createdAt: -1,
});

// Latest marketplace products
productSchema.index({
  createdAt: -1,
});

// Seller's uploaded products
productSchema.index({
  sellerId: 1,
  createdAt: -1,
});

module.exports = mongoose.model("Product", productSchema);
