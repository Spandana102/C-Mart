
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

// ========================================
// ENVIRONMENT CONFIGURATION
// ========================================

dotenv.config({
  path: path.join(__dirname, ".env"),
});

const isProduction = process.env.NODE_ENV === "production";

// ========================================
// DATABASE
// ========================================

const connectDB = require("./config/db");

// ========================================
// IMPORT ROUTES
// ========================================

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const productRoutes = require("./routes/productRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const orderRoutes = require("./routes/orderRoutes");
const swapRoutes = require("./routes/swapRoutes");
const bargainingRoutes = require("./routes/bargainingRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const rentRoutes = require("./routes/rentRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const chatRoutes = require("./routes/chatRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

// ========================================
// OPTIONAL REPORT ROUTES
// ========================================

const reportRoutesPath = path.join(
  __dirname,
  "routes",
  "reportRoutes.js"
);

let reportRoutes = null;

if (fs.existsSync(reportRoutesPath)) {
  reportRoutes = require("./routes/reportRoutes");
}

// ========================================
// CREATE EXPRESS APPLICATION
// ========================================

const app = express();

const PORT = Number(process.env.PORT) || 5000;

// ========================================
// CORS CONFIGURATION
// ========================================

const configuredOrigins = [
  process.env.CLIENT_URLS || "",
  process.env.CLIENT_URL || "",
]
  .flatMap((value) => value.split(","))
  .map((value) => value.trim())
  .filter(Boolean)
  .map((value) => {
    let url;

    try {
      url = new URL(value);
    } catch {
      throw new Error(
        `Invalid frontend origin configured: ${value}`
      );
    }

    if (
      url.protocol !== "http:" &&
      url.protocol !== "https:"
    ) {
      throw new Error(
        `Invalid frontend origin configured: ${value}`
      );
    }

    if (
      isProduction &&
      url.protocol !== "https:"
    ) {
      throw new Error(
        `Production frontend origins must use HTTPS: ${value}`
      );
    }

    return url.origin;
  });

const allowedOrigins = new Set(configuredOrigins);

// ========================================
// MIDDLEWARE
// ========================================

app.use(
  cors({
    origin(origin, callback) {
      const isLocalDevelopmentOrigin =
        !isProduction &&
        /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(
          origin || ""
        );

      if (
        !origin ||
        allowedOrigins.has(origin) ||
        isLocalDevelopmentOrigin
      ) {
        return callback(null, true);
      }

      const error = new Error(
        "Origin is not allowed by CORS"
      );

      error.status = 403;

      return callback(error);
    },

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],

    credentials: true,
  })
);

app.use(
  express.json({
    limit: "10mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);

// ========================================
// REQUEST LOGGER
// ========================================

app.use((req, res, next) => {
  console.log(
    `${req.method} ${req.originalUrl}`
  );

  next();
});

// ========================================
// ENVIRONMENT STATUS
// ========================================

console.log("==================================");
console.log("          C-MART BACKEND");
console.log("==================================");

console.log(
  "Environment:",
  process.env.NODE_ENV || "development"
);

console.log(
  "JWT Secret:",
  Boolean(process.env.JWT_SECRET)
);

console.log(
  "MongoDB URI:",
  Boolean(process.env.MONGO_URI)
);

console.log(
  "Cloudinary Cloud Name:",
  Boolean(process.env.CLOUDINARY_CLOUD_NAME)
);

console.log(
  "Cloudinary API Key:",
  Boolean(process.env.CLOUDINARY_API_KEY)
);

console.log(
  "Cloudinary API Secret:",
  Boolean(process.env.CLOUDINARY_API_SECRET)
);

// ========================================
// HOME ROUTE
// ========================================

app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Welcome to C-MART API",
  });
});

// ========================================
// HEALTH CHECK
// ========================================

app.get("/api/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "C-MART Backend Running Successfully",
    environment: process.env.NODE_ENV || "development",
    database:
      require("mongoose").connection.readyState === 1
        ? "Connected"
        : "Disconnected",
    timestamp: new Date().toISOString(),
  });
});

// ========================================
// AUTHENTICATION
// ========================================

app.use("/api/auth", authRoutes);

// ========================================
// ADMIN PANEL
// ========================================

app.use("/api/admin", adminRoutes);

// ========================================
// PRODUCTS
// ========================================

app.use("/api/products", productRoutes);

// ========================================
// CLOUDINARY IMAGE UPLOAD
// ========================================

app.use("/api/upload", uploadRoutes);

// ========================================
// REVIEWS AND RATINGS
// ========================================

app.use("/api/reviews", reviewRoutes);

// ========================================
// ORDERS
// ========================================

app.use("/api/orders", orderRoutes);

// ========================================
// SWAP MODULE
// ========================================

app.use("/api/swap", swapRoutes);
app.use("/api/swaps", swapRoutes);

// ========================================
// RENT MODULE
// ========================================

app.use("/api/rent", rentRoutes);

// ========================================
// BARGAINING MODULE
// ========================================

app.use("/api/bargain", bargainingRoutes);
app.use("/api/bargaining", bargainingRoutes);

// ========================================
// COMPLAINTS MODULE
// ========================================

app.use("/api/complaints", complaintRoutes);

// ========================================
// NOTIFICATIONS MODULE
// ========================================

app.use(
  "/api/notifications",
  notificationRoutes
);

// ========================================
// REPORTS MODULE
// ========================================

if (reportRoutes) {
  app.use("/api/reports", reportRoutes);

  console.log("Reports API connected");
} else {
  console.log(
    "Reports API file not found - skipped"
  );
}

// ========================================
// WISHLIST MODULE
// ========================================

app.use("/api/wishlist", wishlistRoutes);

// ========================================
// CHAT MODULE
// ========================================

app.use("/api/chat", chatRoutes);

// ========================================
// UNKNOWN API ENDPOINT
// ========================================

app.use("/api", (req, res) => {
  return res.status(404).json({
    success: false,
    message: "API endpoint not found",
    path: req.originalUrl,
    method: req.method,
  });
});

// ========================================
// GLOBAL ERROR HANDLER
// ========================================

app.use((err, req, res, next) => {
  console.error(
    "C-MART Server Error:",
    err
  );

  if (res.headersSent) {
    return next(err);
  }

  const statusCode =
    Number.isInteger(err.status) &&
    err.status >= 400 &&
    err.status < 600
      ? err.status
      : 500;

  const message =
    isProduction && statusCode === 500
      ? "Internal server error"
      : err.message || "Internal server error";

  return res.status(statusCode).json({
    success: false,
    message,
  });
});

// ========================================
// START SERVER
// ========================================

const startServer = async () => {
  try {

    // ====================================
    // VALIDATE FRONTEND URL
    // ====================================

    if (
      isProduction &&
      allowedOrigins.size === 0
    ) {
      throw new Error(
        "CLIENT_URLS or CLIENT_URL must contain the deployed frontend URL"
      );
    }

    // ====================================
    // VALIDATE ENVIRONMENT VARIABLES
    // ====================================

    if (!process.env.MONGO_URI) {
      throw new Error(
        "MONGO_URI missing"
      );
    }

    if (!process.env.JWT_SECRET) {
      throw new Error(
        "JWT_SECRET missing"
      );
    }

    if (
      isProduction &&
      process.env.JWT_SECRET.length < 32
    ) {
      throw new Error(
        "JWT_SECRET must be at least 32 characters in production"
      );
    }

    if (isProduction) {

      const requiredProductionVariables = [
        "GOOGLE_CLIENT_ID",
        "CLOUDINARY_CLOUD_NAME",
        "CLOUDINARY_API_KEY",
        "CLOUDINARY_API_SECRET",
        "RESEND_API_KEY",
        "EMAIL_FROM",
      ];

      const missingVariables =
        requiredProductionVariables.filter(
          (name) => !process.env[name]
        );

      if (missingVariables.length > 0) {
        throw new Error(
          `Missing production configuration: ${missingVariables.join(", ")}`
        );
      }
    }

    // ====================================
    // CONNECT TO MONGODB
    // ====================================

    console.log("Connecting to MongoDB...");

    await connectDB();

    console.log(
      "MongoDB connection step completed"
    );

    // ====================================
    // START EXPRESS SERVER
    // ====================================

    const server = app.listen(
      PORT,
      "0.0.0.0",
      () => {

        console.log("==================================");
        console.log("       C-MART SERVER STARTED");
        console.log("==================================");

        console.log(
          `Server listening on port ${PORT}`
        );

        console.log(
          `Health endpoint: /api/health`
        );

        console.log("Authentication API connected");
        console.log("Admin API connected");
        console.log("Products API connected");
        console.log("Upload API mounted");
        console.log("Reviews API connected");
        console.log("Orders API connected");
        console.log("Swap API mounted");
        console.log("Rent API mounted");
        console.log("Bargaining API connected");
        console.log("Complaints API connected");
        console.log("Wishlist API mounted");
        console.log("Chat API mounted");
        console.log("Notifications API mounted");

        console.log("==================================");
      }
    );

    server.on("error", (error) => {
      console.error(
        "HTTP Server Error:",
        error
      );

      process.exit(1);
    });

  } catch (error) {

    console.error(
      "C-MART startup failed:",
      error.message
    );

    process.exit(1);
  }
};

// ========================================
// RUN APPLICATION
// ========================================

startServer();

