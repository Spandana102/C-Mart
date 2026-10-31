
const mongoose = require("mongoose");

const { Schema } = mongoose;

// ==========================================
// CONSTANTS
// ==========================================

const PAYMENT_METHODS = [
  "None",
  "Cash",
  "UPI",
];

const PAYMENT_STATUSES = [
  "Not Required",
  "Pending",
  "Submitted",
  "Verified",
  "Rejected",
];

const RENT_STATUSES = [
  "Pending",
  "Accepted",
  "Rejected",
  "Active",
  "Return Pending",
  "Completed",
  "Cancelled",
];

const ORDER_STATUSES = [
  "Not Confirmed",
  "Confirmed",
  "In Progress",
  "Completed",
  "Cancelled",
];

const MEET_STATUSES = [
  "Not Scheduled",
  "Scheduled",
  "Confirmed",
];

const RETURN_STATUSES = [
  "Not Scheduled",
  "Scheduled",
  "Confirmed",
  "Returned",
];

// ==========================================
// RENT REQUEST SCHEMA
// ==========================================

const rentRequestSchema = new Schema(
  {
    // ======================================
    // PRODUCT AND STUDENT DETAILS
    // ======================================

    productId: {
      type: Schema.Types.ObjectId,
      ref: "RentProduct",
      required: true,
      index: true,
    },

    renterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ======================================
    // RENTAL DURATION
    // ======================================

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    days: {
      type: Number,
      required: true,
      min: 1,
      max: 90,
    },

    // ======================================
    // RENTAL PRICE
    // ======================================

    dailyPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    // ======================================
    // RENT REQUEST STATUS
    // ======================================

    status: {
      type: String,
      enum: RENT_STATUSES,
      default: "Pending",
      index: true,
    },

    acceptedAt: {
      type: Date,
      default: null,
    },

    rejectedAt: {
      type: Date,
      default: null,
    },

    // ======================================
    // MEET POINT DETAILS
    // ======================================

    meetPoint: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "",
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
        message:
          "Invalid meeting time format. Use HH:MM.",
      },
    },

    meetStatus: {
      type: String,
      enum: MEET_STATUSES,
      default: "Not Scheduled",
    },

    meetConfirmedByRenter: {
      type: Boolean,
      default: false,
    },

    meetConfirmedByOwner: {
      type: Boolean,
      default: false,
    },

    // ======================================
    // PAYMENT DETAILS
    // ======================================

    paymentRequired: {
      type: Boolean,
      default: false,
    },

    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      default: "None",
    },

    paymentMethodSelected: {
      type: Boolean,
      default: false,
    },

    // ======================================
    // SELLER UPI PAYMENT DETAILS
    // ======================================

    sellerUpiId: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 100,
      default: "",
    },

    sellerUpiNumber: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator(value) {
          return (
            !value ||
            /^[6-9]\d{9}$/.test(value)
          );
        },
        message:
          "Enter a valid 10-digit Indian mobile number.",
      },
    },

    // ======================================
    // PAYMENT VERIFICATION
    // ======================================

    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: "Not Required",
    },

    paymentScreenshot: {
      type: String,
      trim: true,
      default: "",
    },

    paymentSubmittedAt: {
      type: Date,
      default: null,
    },

    paymentVerifiedAt: {
      type: Date,
      default: null,
    },

    paymentVerifiedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    paymentRejectionReason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    // ======================================
    // CASH AT MEET POINT
    // ======================================

    cashReceivedAt: {
      type: Date,
      default: null,
    },

    cashReceivedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ======================================
    // RENTAL ORDER CONFIRMATION
    // ======================================

    orderStatus: {
      type: String,
      enum: ORDER_STATUSES,
      default: "Not Confirmed",
    },

    orderConfirmedAt: {
      type: Date,
      default: null,
    },

    // ======================================
    // PRODUCT HANDOVER
    // ======================================

    handoverConfirmedByRenter: {
      type: Boolean,
      default: false,
    },

    handoverConfirmedByOwner: {
      type: Boolean,
      default: false,
    },

    handoverAt: {
      type: Date,
      default: null,
    },

    // ======================================
    // PRODUCT RETURN SCHEDULING
    // ======================================

    // Seller schedules the return.
    // Buyer confirms the return schedule.
    // Both confirm actual product return.

    returnDate: {
      type: Date,
      default: null,
    },

    returnTime: {
      type: String,
      default: "",
      validate: {
        validator(value) {
          return (
            !value ||
            /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
          );
        },
        message:
          "Invalid return time format. Use HH:MM.",
      },
    },

    returnMeetPoint: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "",
    },

    returnStatus: {
      type: String,
      enum: RETURN_STATUSES,
      default: "Not Scheduled",
    },

    returnScheduleConfirmedByRenter: {
      type: Boolean,
      default: false,
    },

    returnScheduleConfirmedByOwner: {
      type: Boolean,
      default: false,
    },

    returnScheduledAt: {
      type: Date,
      default: null,
    },

    // ======================================
    // ACTUAL PRODUCT RETURN
    // ======================================

    returnConfirmedByRenter: {
      type: Boolean,
      default: false,
    },

    returnConfirmedByOwner: {
      type: Boolean,
      default: false,
    },

    returnedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ==========================================
// DATABASE INDEXES
// ==========================================

rentRequestSchema.index({
  productId: 1,
  status: 1,
});

rentRequestSchema.index({
  renterId: 1,
  createdAt: -1,
});

rentRequestSchema.index({
  ownerId: 1,
  createdAt: -1,
});

rentRequestSchema.index({
  returnDate: 1,
  returnStatus: 1,
});

// ==========================================
// VALIDATE RENTAL DATES AND COST
// ==========================================

rentRequestSchema.pre("validate", function () {
  if (!this.startDate || !this.endDate) {
    return;
  }

  const start = new Date(this.startDate);
  const end = new Date(this.endDate);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    this.invalidate(
      "startDate",
      "Invalid rental dates."
    );
    return;
  }

  const startUTC = Date.UTC(
    start.getUTCFullYear(),
    start.getUTCMonth(),
    start.getUTCDate()
  );

  const endUTC = Date.UTC(
    end.getUTCFullYear(),
    end.getUTCMonth(),
    end.getUTCDate()
  );

  if (endUTC < startUTC) {
    this.invalidate(
      "endDate",
      "Return date cannot be before start date."
    );
    return;
  }

  const calculatedDays =
    Math.round(
      (endUTC - startUTC) / 86400000
    ) + 1;

  if (
    calculatedDays < 1 ||
    calculatedDays > 90
  ) {
    this.invalidate(
      "days",
      "Rental duration must be between 1 and 90 days."
    );
    return;
  }

  this.days = calculatedDays;

  if (
    !Number.isFinite(this.dailyPrice) ||
    this.dailyPrice < 0
  ) {
    this.invalidate(
      "dailyPrice",
      "Invalid daily rental price."
    );
    return;
  }

  this.totalPrice =
    Math.round(
      this.dailyPrice * calculatedDays * 100
    ) / 100;
});

// ==========================================
// VALIDATE PAYMENT SETTINGS
// ==========================================

rentRequestSchema.pre("validate", function () {
  if (!this.paymentRequired) {
    this.paymentMethod = "None";
    this.paymentStatus = "Not Required";

    this.sellerUpiId = "";
    this.sellerUpiNumber = "";

    return;
  }

  if (
    !["Cash", "UPI"].includes(
      this.paymentMethod
    )
  ) {
    this.invalidate(
      "paymentMethod",
      "Select Cash at Meet Point or Online UPI."
    );
    return;
  }

  if (this.paymentStatus === "Not Required") {
    this.paymentStatus = "Pending";
  }

  // CASH PAYMENT

  if (this.paymentMethod === "Cash") {
    this.sellerUpiId = "";
    this.sellerUpiNumber = "";

    if (this.paymentStatus === "Submitted") {
      this.invalidate(
        "paymentStatus",
        "Cash payment does not require screenshot submission."
      );
    }
  }

  // UPI PAYMENT

  if (this.paymentMethod === "UPI") {
    const upiId = String(
      this.sellerUpiId || ""
    ).trim();

    if (
      !/^[a-zA-Z0-9._-]{2,256}@[a-zA-Z0-9.-]{2,64}$/.test(
        upiId
      )
    ) {
      this.invalidate(
        "sellerUpiId",
        "Enter a valid seller UPI ID."
      );
    }

    if (
      this.paymentStatus === "Submitted" &&
      !this.paymentScreenshot
    ) {
      this.invalidate(
        "paymentScreenshot",
        "Upload UPI payment screenshot before submitting."
      );
    }
  }

  if (this.paymentStatus === "Verified") {
    if (!this.paymentVerifiedBy) {
      this.invalidate(
        "paymentVerifiedBy",
        "Seller verification is required."
      );
    }

    if (!this.paymentVerifiedAt) {
      this.paymentVerifiedAt = new Date();
    }
  }
});

// ==========================================
// VALIDATE CASH PAYMENT CONFIRMATION
// ==========================================

rentRequestSchema.pre("validate", function () {
  if (
    this.paymentMethod !== "Cash" ||
    this.paymentStatus !== "Verified"
  ) {
    return;
  }

  if (!this.cashReceivedAt) {
    this.cashReceivedAt =
      this.paymentVerifiedAt || new Date();
  }

  if (
    !this.cashReceivedBy &&
    this.paymentVerifiedBy
  ) {
    this.cashReceivedBy =
      this.paymentVerifiedBy;
  }
});

// ==========================================
// VALIDATE MEET POINT CONFIRMATION
// ==========================================

rentRequestSchema.pre("validate", function () {
  if (this.meetStatus !== "Confirmed") {
    return;
  }

  if (
    !this.meetPoint ||
    !this.meetingDate ||
    !this.meetingTime
  ) {
    this.invalidate(
      "meetStatus",
      "Meet point, date and time are required."
    );
  }

  if (
    !this.meetConfirmedByRenter ||
    !this.meetConfirmedByOwner
  ) {
    this.invalidate(
      "meetStatus",
      "Both students must confirm the meeting."
    );
  }
});

// ==========================================
// VALIDATE RENTAL ORDER
// ==========================================

rentRequestSchema.pre("validate", function () {
  const confirmedStatuses = [
    "Confirmed",
    "In Progress",
    "Completed",
  ];

  if (
    !confirmedStatuses.includes(
      this.orderStatus
    )
  ) {
    return;
  }

  if (this.meetStatus !== "Confirmed") {
    this.invalidate(
      "orderStatus",
      "Both students must confirm meet point first."
    );
  }

  if (
    this.paymentRequired &&
    this.paymentMethod === "UPI" &&
    this.paymentStatus !== "Verified"
  ) {
    this.invalidate(
      "orderStatus",
      "UPI payment must be verified before confirming the rental order."
    );
  }
});

// ==========================================
// VALIDATE PRODUCT HANDOVER
// ==========================================

rentRequestSchema.pre("validate", function () {
  const handoverStatuses = [
    "Active",
    "Return Pending",
    "Completed",
  ];

  if (
    !handoverStatuses.includes(this.status)
  ) {
    return;
  }

  if (
    !this.handoverConfirmedByOwner ||
    !this.handoverConfirmedByRenter
  ) {
    this.invalidate(
      "status",
      "Both students must confirm product handover."
    );
  }

  if (
    ![
      "Confirmed",
      "In Progress",
      "Completed",
    ].includes(this.orderStatus)
  ) {
    this.invalidate(
      "orderStatus",
      "Rental order must be confirmed before handover."
    );
  }

  if (
    this.paymentRequired &&
    this.paymentStatus !== "Verified"
  ) {
    this.invalidate(
      "paymentStatus",
      "Payment must be verified before product handover."
    );
  }
});

// ==========================================
// VALIDATE RETURN SCHEDULE
// ==========================================

rentRequestSchema.pre("validate", function () {
  if (this.returnStatus === "Not Scheduled") {
    return;
  }

  if (
    !this.returnDate ||
    !this.returnTime ||
    !this.returnMeetPoint
  ) {
    this.invalidate(
      "returnStatus",
      "Return date, time and location are required."
    );
    return;
  }

  const returnDate = new Date(this.returnDate);

  if (Number.isNaN(returnDate.getTime())) {
    this.invalidate(
      "returnDate",
      "Invalid product return date."
    );
    return;
  }

  const returnDay = Date.UTC(
    returnDate.getUTCFullYear(),
    returnDate.getUTCMonth(),
    returnDate.getUTCDate()
  );

  const rentalStart = new Date(this.startDate);

  if (!Number.isNaN(rentalStart.getTime())) {
    const startDay = Date.UTC(
      rentalStart.getUTCFullYear(),
      rentalStart.getUTCMonth(),
      rentalStart.getUTCDate()
    );

    if (returnDay < startDay) {
      this.invalidate(
        "returnDate",
        "Return date cannot be before rental start date."
      );
    }
  }

  if (
    ["Confirmed", "Returned"].includes(
      this.returnStatus
    )
  ) {
    if (
      !this.returnScheduleConfirmedByRenter ||
      !this.returnScheduleConfirmedByOwner
    ) {
      this.invalidate(
        "returnStatus",
        "Both students must confirm the return schedule."
      );
    }
  }
});

// ==========================================
// VALIDATE RENTAL COMPLETION
// ==========================================

rentRequestSchema.pre("validate", function () {
  if (this.status !== "Completed") {
    return;
  }

  if (
    !this.returnConfirmedByRenter ||
    !this.returnConfirmedByOwner
  ) {
    this.invalidate(
      "status",
      "Both students must confirm product return."
    );
    return;
  }

  if (this.returnStatus !== "Returned") {
    this.invalidate(
      "returnStatus",
      "Return status must be Returned before completing the rental."
    );
    return;
  }

  this.orderStatus = "Completed";

  if (!this.returnedAt) {
    this.returnedAt = new Date();
  }

  if (!this.completedAt) {
    this.completedAt = new Date();
  }
});

// ==========================================
// EXPORT MODEL
// ==========================================

module.exports =
  mongoose.models.RentRequest ||
  mongoose.model(
    "RentRequest",
    rentRequestSchema
  );
