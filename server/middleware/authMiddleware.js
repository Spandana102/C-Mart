
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");

// ==========================================
// C-MART JWT AUTHENTICATION MIDDLEWARE
// ==========================================

const authMiddleware = async (req, res, next) => {
  try {
    // ======================================
    // STEP 1: CHECK AUTHORIZATION HEADER
    // ======================================

    const authHeader = req.headers.authorization;

    if (
      typeof authHeader !== "string" ||
      !/^Bearer\s+\S+$/i.test(authHeader.trim())
    ) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please login.",
      });
    }

    // ======================================
    // STEP 2: EXTRACT JWT TOKEN
    // ======================================

    const token = authHeader.trim().split(/\s+/)[1];

    // ======================================
    // STEP 3: CHECK JWT SECRET
    // ======================================

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing");

      return res.status(500).json({
        success: false,
        message: "Authentication configuration error.",
      });
    }

    // ======================================
    // STEP 4: VERIFY JWT TOKEN
    // ======================================

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET,
      {
        algorithms: ["HS256"],
      }
    );

    // ======================================
    // STEP 5: VALIDATE USER ID
    // ======================================

    const userId = decoded?.id;

    if (
      typeof userId !== "string" ||
      !mongoose.isObjectIdOrHexString(userId)
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid session. Please login again.",
      });
    }

    // ======================================
    // STEP 6: FETCH USER FROM DATABASE
    // ======================================

    const user = await User.findById(userId).select(
      "_id fullName email role status isBlocked collegeId phoneNumber"
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Account not found. Please login again.",
      });
    }

    // ======================================
    // STEP 7: CHECK BLOCKED ACCOUNT
    // ======================================

    const isBlocked =
      user.isBlocked === true ||
      String(user.status || "").toLowerCase() === "blocked";

    if (isBlocked) {
      return res.status(403).json({
        success: false,
        message:
          "Your account is blocked. Please contact the administrator.",
      });
    }

    // ======================================
    // STEP 8: ATTACH USER TO REQUEST
    // ======================================

    const authenticatedUserId = user._id.toString();

    req.user = {
      id: authenticatedUserId,
      _id: authenticatedUserId,
      userId: authenticatedUserId,

      fullName: user.fullName,
      email: user.email,
      collegeId: user.collegeId,
      phoneNumber: user.phoneNumber,

      role: user.role || "user",
      status: user.status || "Active",
      isBlocked: false,
    };

    // ======================================
    // STEP 9: CONTINUE TO API ROUTE
    // ======================================

    return next();

  } catch (error) {

    // ======================================
    // EXPIRED JWT TOKEN
    // ======================================

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please login again.",
      });
    }

    // ======================================
    // INVALID JWT TOKEN
    // ======================================

    if (
      error.name === "JsonWebTokenError" ||
      error.name === "NotBeforeError"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid token. Please login again.",
      });
    }

    // ======================================
    // INVALID MONGODB USER ID
    // ======================================

    if (error instanceof mongoose.Error.CastError) {
      return res.status(401).json({
        success: false,
        message: "Invalid user account.",
      });
    }

    // ======================================
    // INTERNAL AUTHENTICATION ERROR
    // ======================================

    console.error(
      "Authentication Error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Authentication failed. Please try again.",
    });
  }
};

module.exports = authMiddleware;
