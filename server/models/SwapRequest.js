
const mongoose = require("mongoose");

const { Schema } = mongoose;

// =====================================
// C-MART SWAP REQUEST MODEL
// =====================================

const swapRequestSchema = new Schema(
  {
    // =====================================
    // SWAP PRODUCT DETAILS
    // =====================================

    productId: {
      type: Schema.Types.ObjectId,
      ref: "SwapProduct",
      required: true,
    },

    // Product Owner
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Swap Requester
    buyerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // =====================================
    // OFFERED PRODUCT DETAILS
    // =====================================

    offeredProductId: {
      type: Schema.Types.ObjectId,
      ref: "SwapProduct",
      default: null,
    },

    offeredProductName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    offeredProductDescription: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },

    // =====================================
    // SWAP REQUEST STATUS
    // =====================================

    status: {
      type: String,
      enum: [
        "Pending",
        "Accepted",
        "Rejected",
        "Completed",
        "Cancelled",
      ],
      default: "Pending",
    },

    acceptedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    // =====================================
    // MEET POINT DETAILS
    // =====================================

    meetPoint: {
      type: String,
      trim: true,
      default: "",
      maxlength: 150,
    },

    meetingDate: {
      type: Date,
      default: null,
    },

    meetingTime: {
      type: String,
      default: "",
      validate: {
        validator(value) {
          return (
            !value ||
            /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
          );
        },
        message: "Meeting time must be in HH:MM format.",
      },
    },

    meetStatus: {
      type: String,
      enum: [
        "Not Scheduled",
        "Scheduled",
        "Confirmed",
        "Completed",
        "Cancelled",
      ],
      default: "Not Scheduled",
    },

    meetScheduledBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    meetConfirmedByBuyer: {
      type: Boolean,
      default: false,
    },

    meetConfirmedBySeller: {
      type: Boolean,
      default: false,
    },

    // =====================================
    // OPTIONAL SWAP PAYMENT
    // =====================================

    // false = Free Swap
    // true = Swap with Additional Payment
    paymentRequired: {
      type: Boolean,
      default: false,
    },

    // Extra amount agreed by both students
    additionalAmount: {
      type: Number,
      default: 0,
      min: 0,
      max: 1000000,
    },

    // Seller = Product Owner
    // Buyer = Swap Requester
    paymentPayer: {
      type: String,
      enum: ["None", "Seller", "Buyer"],
      default: "None",
    },

    // Payment method
    paymentMethod: {
      type: String,
      enum: ["None", "Cash", "UPI"],
      default: "None",
    },

    // Receiver is opposite of payer
    paymentReceiverId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // =====================================
    // PAYMENT TERMS AGREEMENT
    // =====================================

    paymentAgreedBySeller: {
      type: Boolean,
      default: false,
    },

    paymentAgreedByBuyer: {
      type: Boolean,
      default: false,
    },

    paymentTermsConfirmedAt: {
      type: Date,
      default: null,
    },

    // =====================================
    // UPI PAYMENT DETAILS
    // =====================================

    receiverUpiId: {
      type: String,
      trim: true,
      default: "",
      maxlength: 320,
    },

    receiverUpiNumber: {
      type: String,
      trim: true,
      default: "",
      maxlength: 10,
    },

    // Cloudinary image URL
    paymentScreenshot: {
      type: String,
      trim: true,
      default: "",
      maxlength: 2048,
    },

    paymentSubmittedAt: {
      type: Date,
      default: null,
    },

    // =====================================
    // PAYMENT VERIFICATION
    // =====================================

    paymentStatus: {
      type: String,
      enum: [
        "Not Required",
        "Pending",
        "Submitted",
        "Verified",
        "Rejected",
      ],
      default: "Not Required",
    },

    paymentVerifiedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    paymentVerifiedAt: {
      type: Date,
      default: null,
    },

    paymentRejectionReason: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },

    // =====================================
    // EXCHANGE CONFIRMATION
    // =====================================

    buyerExchangeConfirmed: {
      type: Boolean,
      default: false,
    },

    sellerExchangeConfirmed: {
      type: Boolean,
      default: false,
    },

    buyerConfirmedAt: {
      type: Date,
      default: null,
    },

    sellerConfirmedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// =====================================
// MODEL VALIDATION
// =====================================

swapRequestSchema.pre("validate", function () {
  const sameId = (a, b) =>
    Boolean(a && b) && String(a) === String(b);

  // -------------------------------------
  // VALIDATE SWAP PARTICIPANTS
  // -------------------------------------

  if (
    this.sellerId &&
    this.buyerId &&
    sameId(this.sellerId, this.buyerId)
  ) {
    this.invalidate(
      "buyerId",
      "Product owner cannot swap with themselves."
    );
  }

  // -------------------------------------
  // VALIDATE PAID SWAP
  // -------------------------------------

  if (this.paymentRequired) {
    if (
      !Number.isFinite(this.additionalAmount) ||
      this.additionalAmount <= 0 ||
      this.additionalAmount > 1000000
    ) {
      this.invalidate(
        "additionalAmount",
        "Additional payment must be between ₹1 and ₹10,00,000."
      );
    }

    if (
      !["Seller", "Buyer"].includes(
        this.paymentPayer
      )
    ) {
      this.invalidate(
        "paymentPayer",
        "Select the Product Owner or Swap Requester as payer."
      );
    }

    if (
      !["Cash", "UPI"].includes(
        this.paymentMethod
      )
    ) {
      this.invalidate(
        "paymentMethod",
        "Select Cash or UPI payment method."
      );
    }

    // Identify the receiver automatically
    if (this.paymentPayer === "Seller") {
      this.paymentReceiverId = this.buyerId;
    } else if (this.paymentPayer === "Buyer") {
      this.paymentReceiverId = this.sellerId;
    }

    // -------------------------------------
    // PAYMENT STATUS VALIDATION
    // -------------------------------------

    if (
      this.paymentStatus === "Not Required"
    ) {
      this.invalidate(
        "paymentStatus",
        "Paid swap must have a valid payment status."
      );
    }

    // Both students must agree before
    // payment submission or verification.
    if (
      ["Submitted", "Verified"].includes(
        this.paymentStatus
      ) &&
      !(
        this.paymentAgreedBySeller &&
        this.paymentAgreedByBuyer
      )
    ) {
      this.invalidate(
        "paymentStatus",
        "Both students must agree to payment terms first."
      );
    }

    // -------------------------------------
    // UPI VALIDATION
    // -------------------------------------

    if (this.paymentMethod === "UPI") {
      if (
        ["Submitted", "Verified"].includes(
          this.paymentStatus
        )
      ) {
        if (!this.receiverUpiId) {
          this.invalidate(
            "receiverUpiId",
            "Receiver UPI ID is required."
          );
        }

        if (!this.paymentScreenshot) {
          this.invalidate(
            "paymentScreenshot",
            "UPI payment screenshot is required."
          );
        }
      }
    }

    // Cash payments do not require
    // screenshots.
    if (this.paymentMethod === "Cash") {
      this.receiverUpiId = "";
      this.receiverUpiNumber = "";
      this.paymentScreenshot = "";
      this.paymentSubmittedAt = null;
    }

    // -------------------------------------
    // PAYMENT VERIFICATION
    // -------------------------------------

    if (this.paymentStatus === "Verified") {
      if (!this.paymentVerifiedBy) {
        this.invalidate(
          "paymentVerifiedBy",
          "Payment receiver must verify payment."
        );
      }

      if (!this.paymentVerifiedAt) {
        this.invalidate(
          "paymentVerifiedAt",
          "Payment verification date is required."
        );
      }

      if (
        this.paymentVerifiedBy &&
        this.paymentReceiverId &&
        !sameId(
          this.paymentVerifiedBy,
          this.paymentReceiverId
        )
      ) {
        this.invalidate(
          "paymentVerifiedBy",
          "Only the actual payment receiver can verify payment."
        );
      }
    }
  } else {
    // -------------------------------------
    // FREE SWAP
    // -------------------------------------

    this.additionalAmount = 0;
    this.paymentPayer = "None";
    this.paymentMethod = "None";
    this.paymentReceiverId = null;
    this.paymentStatus = "Not Required";

    this.receiverUpiId = "";
    this.receiverUpiNumber = "";

    this.paymentScreenshot = "";
    this.paymentSubmittedAt = null;

    this.paymentVerifiedBy = null;
    this.paymentVerifiedAt = null;
    this.paymentRejectionReason = "";
  }

  // =====================================
  // AGREEMENT VALIDATION
  // =====================================

  if (
    this.paymentTermsConfirmedAt &&
    !(
      this.paymentAgreedBySeller &&
      this.paymentAgreedByBuyer
    )
  ) {
    this.invalidate(
      "paymentTermsConfirmedAt",
      "Both students must agree before confirming swap terms."
    );
  }

  // =====================================
  // EXCHANGE CONFIRMATION VALIDATION
  // =====================================

  if (
    this.buyerExchangeConfirmed &&
    !this.buyerConfirmedAt
  ) {
    this.invalidate(
      "buyerConfirmedAt",
      "Buyer confirmation date is required."
    );
  }

  if (
    this.sellerExchangeConfirmed &&
    !this.sellerConfirmedAt
  ) {
    this.invalidate(
      "sellerConfirmedAt",
      "Seller confirmation date is required."
    );
  }

  // =====================================
  // COMPLETED SWAP VALIDATION
  // =====================================

  if (this.status === "Completed") {
    // Both students must confirm exchange.
    if (
      !this.buyerExchangeConfirmed ||
      !this.sellerExchangeConfirmed
    ) {
      this.invalidate(
        "status",
        "Both students must confirm product exchange."
      );
    }

    // Both must agree to payment terms,
    // including free swap terms.
    if (
      !this.paymentAgreedBySeller ||
      !this.paymentAgreedByBuyer
    ) {
      this.invalidate(
        "status",
        "Both students must agree to swap terms."
      );
    }

    // Meeting must be confirmed/completed.
    if (
      !["Confirmed", "Completed"].includes(
        this.meetStatus
      )
    ) {
      this.invalidate(
        "meetStatus",
        "Meeting must be confirmed before completing swap."
      );
    }

    // Paid swap must have verified payment.
    if (
      this.paymentRequired &&
      this.paymentStatus !== "Verified"
    ) {
      this.invalidate(
        "paymentStatus",
        "Additional payment must be verified before swap completion."
      );
    }

    if (!this.completedAt) {
      this.completedAt = new Date();
    }
  }
});

// =====================================
// DATABASE INDEXES
// =====================================

swapRequestSchema.index({
  buyerId: 1,
  createdAt: -1,
});

swapRequestSchema.index({
  sellerId: 1,
  createdAt: -1,
});

swapRequestSchema.index({
  productId: 1,
  status: 1,
});

swapRequestSchema.index({
  paymentRequired: 1,
  paymentStatus: 1,
});

// =====================================
// EXPORT MODEL
// =====================================

module.exports =
  mongoose.models.SwapRequest ||
  mongoose.model(
    "SwapRequest",
    swapRequestSchema
  );
