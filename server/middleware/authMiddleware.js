
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");

// ==========================================
// JWT AUTHENTICATION MIDDLEWARE
// ==========================================

const authMiddleware = async (req, res, next) => {
  try {
    // STEP 1: Read Authorization header
    const authHeader = req.headers.authorization;

    if (
      typeof authHeader !== "string" ||
      !/^Bearer\s+\S+$/i.test(authHeader.trim())
    ) {
      return res.status(401).json({
        success: false,
        message: "No valid token provided. Please login.",
      });
    }

    // STEP 2: Extract JWT token
    const token = authHeader.trim().split(/\s+/)[1];

    // STEP 3: Verify JWT configuration
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing");

      return res.status(500).json({
        success: false,
        message: "Authentication configuration error.",
      });
    }

    // STEP 4: Verify token signature and expiry
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET,
      {
        algorithms: ["HS256"],
      }
    );

    // STEP 5: Validate user ID from JWT
    const userId = decoded.id;

    if (
      typeof userId !== "string" ||
      !mongoose.isObjectIdOrHexString(userId)
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload. Please login again.",
      });
    }

    // STEP 6: Fetch current user from MongoDB
    const user = await User.findById(userId).select(
      "_id fullName email role status isBlocked collegeId phoneNumber"
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Account not found. Please login again.",
      });
    }

    // STEP 7: Check whether account is blocked
    const blocked =
      user.isBlocked === true ||
      String(user.status || "").toLowerCase() === "blocked";

    if (blocked) {
      return res.status(403).json({
        success: false,
        message:
          "Your account has been blocked. Please contact the administrator.",
      });
    }

    // STEP 8: Attach verified user information
    req.user = {
      id: user._id.toString(),
      _id: user._id.toString(),
      userId: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      collegeId: user.collegeId,
      phoneNumber: user.phoneNumber,
      role: user.role || "user",
      status: user.status || "Active",
      isBlocked: false,
    };

    // STEP 9: Continue to protected route
    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please login again.",
      });
    }

    if (
      error.name === "JsonWebTokenError" ||
      error.name === "NotBeforeError"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid token. Please login again.",
      });
    }

    console.error(
      "Authentication Error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Authentication failed.",
    });
  }
};

module.exports = authMiddleware;
