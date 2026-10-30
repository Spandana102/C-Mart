
const mongoose = require("mongoose");

// ======================================
// C-MART COMPLAINT SCHEMA
// ======================================
const complaintSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: [true, "User name is required"],
      trim: true,
      maxlength: 100,
    },

    userEmail: {
      type: String,
      required: [true, "User email is required"],
      trim: true,
      lowercase: true,
    },

    subject: {
      type: String,
      required: [true, "Complaint subject is required"],
      trim: true,
      maxlength: 150,
    },

    description: {
      type: String,
      required: [true, "Complaint description is required"],
      trim: true,
      maxlength: 3000,
    },

    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

// ======================================
// CREATE / EXPORT COMPLAINT MODEL
// ======================================
const Complaint =
  mongoose.models.Complaint ||
  mongoose.model("Complaint", complaintSchema);

module.exports = Complaint;
