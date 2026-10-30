
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    // Product Name
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Selling Price
    price: {
      type: Number,
      required: true,
      min: 0,
    },

    // Original Price
    mrp: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Product Category
    category: {
      type: String,
      required: true,
      trim: true,
    },

    // Product Description
    description: {
      type: String,
      default: "",
    },

    // Cloudinary Image URLs
    images: {
      type: [String],
      default: [],
    },

    // Available Stock
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Product Condition
    condition: {
      type: String,
      enum: ["New", "Used"],
      default: "Used",
    },

    // Product Brand
    brand: {
      type: String,
      default: "",
      trim: true,
    },

    // Additional Product Details
    specifications: {
      type: Map,
      of: String,
      default: {},
    },

    // Product Seller
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

// Marketplace category and latest products
productSchema.index({
  category: 1,
  createdAt: -1,
});

// Latest products listing
productSchema.index({
  createdAt: -1,
});

module.exports = mongoose.model(
  "Product",
  productSchema
);
