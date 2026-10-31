
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

    // PAYMENT INFORMATION
    paymentMethod: {
      type: String,
      enum: ["UPI", "Cash", "Other"],
      default: "UPI",
    },

    paymentStatus: {
      type: String,
      enum: [
        "Not Submitted",
        "Pending",
        "Verified",
        "Rejected",
      ],
      default: "Not Submitted",
    },

    // PAYMENT SCREENSHOT
    paymentScreenshot: {
      type: String,
      default: "",
    },

    // CLOUDINARY IMAGE IDENTIFIER
    paymentScreenshotPublicId: {
      type: String,
      default: "",
    },

    // PAYMENT SUBMISSION DATE
    paymentSubmittedAt: {
      type: Date,
      default: null,
    },

    // PAYMENT VERIFICATION DATE
    paymentVerifiedAt: {
      type: Date,
      default: null,
    },

    // SELLER WHO VERIFIED PAYMENT
    paymentVerifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // PAYMENT REJECTION REASON
    paymentRejectionReason: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// BUYER ORDER HISTORY
orderSchema.index({
  buyer: 1,
  createdAt: -1,
});

// SELLER RECEIVED ORDERS
orderSchema.index({
  seller: 1,
  createdAt: -1,
});

// SELLER PAYMENT VERIFICATION QUEUE
orderSchema.index({
  seller: 1,
  paymentStatus: 1,
});

// PREVENT BUYER AND SELLER BEING SAME USER
orderSchema.pre("validate", function () {
  if (
    this.buyer &&
    this.seller &&
    this.buyer.toString() === this.seller.toString()
  ) {
    this.invalidate(
      "seller",
      "Buyer cannot purchase their own product."
    );
  }
});

module.exports =
  mongoose.models.Order ||
  mongoose.model("Order", orderSchema);
