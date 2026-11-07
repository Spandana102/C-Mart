
const express = require("express");
const router = express.Router();

// ==========================================
// CONTROLLERS
// ==========================================

const {
  registerUser,
  loginUser,
  googleLogin,
  getProfile,
  updateProfile,
  forgotPassword,
  verifyOTP,
  resetPassword,
} = require("../controllers/authController");

// ==========================================
// MIDDLEWARE
// ==========================================

const authMiddleware = require("../middleware/authMiddleware");

// ==========================================
// PUBLIC AUTHENTICATION ROUTES
// ==========================================

// Student registration
router.post("/register", registerUser);

// Email and password login
router.post("/login", loginUser);

// Google authentication
router.post("/google", googleLogin);

// Forgot password - send OTP
router.post("/forgot-password", forgotPassword);

// Verify password reset OTP
router.post("/verify-otp", verifyOTP);

// Reset password
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
