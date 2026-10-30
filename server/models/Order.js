
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    // BUYER INFORMATION
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // SELLER INFORMATION
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // PRODUCT INFORMATION
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    productName: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    quantity: {
      type: Number,
      default: 1,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "Quantity must be a whole number",
      },
    },

    // MEET POINT INFORMATION
    meetPoint: {
      type: String,
      required: true,
      trim: true,
    },

    meetingDate: {
      type: String,
      required: true,
    },

    meetingTime: {
      type: String,
      required: true,
    },

    // ORDER STATUS
    status: {
      type: String,
      enum: [
        "Processing",
        "Confirmed",
        "Delivered",
        "Cancelled",
      ],
      default: "Processing",
    },
  },
  {
    timestamps: true,
  }
);

// Buyer order history
orderSchema.index({ buyer: 1, createdAt: -1 });

// Seller received orders
orderSchema.index({ seller: 1, createdAt: -1 });

module.exports =
  mongoose.models.Order ||
  mongoose.model("Order", orderSchema);
