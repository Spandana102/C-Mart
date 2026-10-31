
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // ==========================================
    // USER DETAILS
    // ==========================================

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

    // ==========================================
    // AUTHENTICATION PROVIDER
    // ==========================================

    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    // ==========================================
    // GOOGLE ACCOUNT
    // ==========================================

    googleId: {
      type: String,
      unique: true,
      sparse: true,
      default: undefined,
      select: false,
    },

    // ==========================================
    // PASSWORD
    // ==========================================

    password: {
      type: String,
      required: function () {
        return this.authProvider !== "google";
      },
      select: false,
    },

    // ==========================================
    // GOOGLE PROFILE IMAGE
    // ==========================================

    profilePicture: {
      type: String,
      default: "",
      trim: true,
    },

    // ==========================================
    // COLLEGE ID
    // ==========================================

    collegeId: {
      type: String,
      required: true,
      trim: true,
      default: "189",
      enum: ["189"],
    },

    // ==========================================
    // PHONE NUMBER
    // ==========================================

    phoneNumber: {
      type: String,
      required: function () {
        return this.authProvider !== "google";
      },
      trim: true,
      match: [
        /^[0-9]{10}$/,
        "Phone number must contain exactly 10 digits",
      ],
    },

    // ==========================================
    // USER ROLE
    // ==========================================

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    // ==========================================
    // ACCOUNT STATUS
    // ==========================================

    status: {
      type: String,
      enum: ["Active", "Blocked"],
      default: "Active",
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    // ==========================================
    // PASSWORD RESET / OTP
    // ==========================================

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

// ==========================================
// SYNCHRONIZE ACCOUNT STATUS
// ==========================================

userSchema.pre("validate", function () {
  const statusChanged = this.isModified("status");
  const blockedChanged = this.isModified("isBlocked");

  if (blockedChanged) {
    this.status = this.isBlocked ? "Blocked" : "Active";
  } else if (statusChanged) {
    this.isBlocked = this.status === "Blocked";
  } else if (this.isNew) {
    const blocked =
      this.isBlocked === true ||
      this.status === "Blocked";

    this.isBlocked = blocked;
    this.status = blocked ? "Blocked" : "Active";
  }
});

// ==========================================
// INSTANCE METHOD: CHECK BLOCKED USER
// ==========================================

userSchema.methods.isAccountBlocked = function () {
  return (
    this.isBlocked === true ||
    String(this.status || "").toLowerCase() === "blocked"
  );
};

// ==========================================
// INSTANCE METHOD: SAFE USER RESPONSE
// ==========================================

userSchema.methods.toSafeObject = function () {
  return {
    _id: this._id,
    fullName: this.fullName,
    email: this.email,
    collegeId: this.collegeId,
    phoneNumber: this.phoneNumber,
    profilePicture: this.profilePicture,
    authProvider: this.authProvider,
    role: this.role,
    status: this.status,
    isBlocked: this.isAccountBlocked(),
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

// ==========================================
// DATABASE INDEXES
// ==========================================

userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ isBlocked: 1 });

// ==========================================
// EXPORT USER MODEL
// ==========================================

const User =
  mongoose.models.User ||
  mongoose.model("User", userSchema);

module.exports = User;
