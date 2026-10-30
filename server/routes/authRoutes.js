
const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  forgotPassword,
  verifyOTP,
  resetPassword,
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");

// ==========================================
// PUBLIC AUTHENTICATION ROUTES
// ==========================================

// Register new student
router.post("/register", registerUser);

// Login student or admin
router.post("/login", loginUser);

// Send password reset OTP to registered email
router.post("/forgot-password", forgotPassword);

// Verify the OTP received through email
router.post("/verify-otp", verifyOTP);

// Set a new password after OTP verification
router.post("/reset-password", resetPassword);

// ==========================================
// PROTECTED PROFILE ROUTES
// ==========================================

// Get logged-in user's profile
router.get("/profile", authMiddleware, getProfile);

// Update logged-in user's profile
router.put("/profile", authMiddleware, updateProfile);

// ==========================================
// EXPORT ROUTER
// ==========================================

module.exports = router;
