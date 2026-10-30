
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // USER DETAILS
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email",
      ],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },

    // FIXED COLLEGE ID
    collegeId: {
      type: String,
      required: true,
      trim: true,
      default: "189",
      enum: ["189"],
    },

    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      match: [
        /^[0-9]{10}$/,
        "Phone number must contain exactly 10 digits",
      ],
    },

    // USER ROLE
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    // ACCOUNT STATUS
    status: {
      type: String,
      enum: ["Active", "Blocked"],
      default: "Active",
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    // PASSWORD RESET / OTP
    resetPasswordToken: {
      type: String,
      default: null,
      select: false,
    },

    resetPasswordExpires: {
      type: Date,
      default: null,
      select: false,
    },

    resetPasswordAttempts: {
      type: Number,
      default: 0,
      select: false,
    },

    resetPasswordRequestedAt: {
      type: Date,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// DATABASE INDEXES
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });

// EXPORT USER MODEL
const User =
  mongoose.models.User ||
  mongoose.model("User", userSchema);

module.exports = User;
