
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const authMiddleware = (req, res, next) => {
  try {
    // STEP 1: Check Authorization header
    const authHeader = req.headers.authorization;

    if (
      !authHeader ||
      typeof authHeader !== "string" ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message: "No token provided. Please login.",
      });
    }

    // STEP 2: Extract JWT token
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization token.",
      });
    }

    // STEP 3: Check JWT secret
    if (!process.env.JWT_SECRET) {
      console.error(
        "JWT_SECRET is missing from environment variables"
      );

      return res.status(500).json({
        success: false,
        message: "Authentication configuration error.",
      });
    }

    // STEP 4: Verify JWT token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // STEP 5: Extract authenticated user ID
    const userId =
      decoded.id ||
      decoded._id ||
      decoded.userId ||
      decoded.sub;

    if (
      !userId ||
      !mongoose.isValidObjectId(userId)
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid token payload. Please login again.",
      });
    }

    // STEP 6: Attach authenticated user details
    req.user = {
      ...decoded,
      id: String(userId),
      _id: String(userId),
      userId: String(userId),
    };

    // STEP 7: Continue to protected route
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message:
          "Session expired. Please login again.",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message:
          "Invalid token. Please login again.",
      });
    }

    if (error.name === "NotBeforeError") {
      return res.status(401).json({
        success: false,
        message:
          "Token is not active yet. Please login again.",
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
