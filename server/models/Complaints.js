const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
      trim: true,
    },

    userEmail: {
      type: String,
      required: true,
      trim: true,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved"],
      default: "Pending",
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  }
);

const Complaint = mongoose.model(
  "Complaint",
  complaintSchema
);

module.exports = Complaint;