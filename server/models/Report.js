
const mongoose = require("mongoose");

// =====================================
// REPORT SCHEMA
// =====================================

const reportSchema = new mongoose.Schema(
  {
    // =====================================
    // REPORTER DETAILS
    // =====================================

    reporterName: {
      type: String,
      required: [true, "Reporter name is required"],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    reporterEmail: {
      type: String,
      required: [true, "Reporter email is required"],
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email",
      ],
    },

    // =====================================
    // REPORTED USER / PRODUCT
    // =====================================

    reportedUser: {
      type: String,
      default: "",
      trim: true,
      maxlength: 200,
    },

    reportedProduct: {
      type: String,
      default: "",
      trim: true,
      maxlength: 200,
    },

    // =====================================
    // REPORT DETAILS
    // =====================================

    reason: {
      type: String,
      required: [true, "Report reason is required"],
      trim: true,
      minlength: 1,
      maxlength: 200,
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 3000,
    },

    // =====================================
    // REPORT STATUS
    // =====================================

    status: {
      type: String,
      enum: [
        "Pending",
        "In Progress",
        "Reviewed",
        "Resolved",
        "Rejected",
      ],
      default: "Pending",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// =====================================
// VALIDATION
// =====================================

// A report must identify at least one
// user or product.
reportSchema.pre("validate", function (next) {
  const hasUser =
    typeof this.reportedUser === "string" &&
    this.reportedUser.trim().length > 0;

  const hasProduct =
    typeof this.reportedProduct === "string" &&
    this.reportedProduct.trim().length > 0;

  if (!hasUser && !hasProduct) {
    this.invalidate(
      "reportedProduct",
      "Please select a user or product to report"
    );
  }

  next();
});

// =====================================
// DATABASE INDEXES
// =====================================

reportSchema.index({ reporterEmail: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ createdAt: -1 });

// =====================================
// MODEL EXPORT
// =====================================

const Report =
  mongoose.models.Report ||
  mongoose.model("Report", reportSchema);

module.exports = Report;
