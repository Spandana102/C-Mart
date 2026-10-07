const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    reporterName: {
      type: String,
      required: true,
      trim: true,
    },

    reporterEmail: {
      type: String,
      required: true,
      trim: true,
    },

    reportedUser: {
      type: String,
      default: "",
      trim: true,
    },

    reportedProduct: {
      type: String,
      default: "",
      trim: true,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Reviewed", "Resolved"],
      default: "Pending",
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  }
);

const Report = mongoose.model("Report", reportSchema);

module.exports = Report;