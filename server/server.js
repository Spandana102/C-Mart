
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

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
// CREATE EXPRESS APP
// ========================================
const app = express();

const PORT = process.env.PORT || 5000;

// ========================================
// MIDDLEWARE
// ========================================
app.use(cors());

app.use(express.json({ limit: "10mb" }));

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
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// ========================================
// ENVIRONMENT STATUS
// ========================================
console.log("==================================");
console.log("          C-MART BACKEND");
console.log("==================================");

console.log("JWT Secret:", !!process.env.JWT_SECRET);
console.log("MongoDB URI:", !!process.env.MONGO_URI);

console.log(
  "Cloudinary Cloud Name:",
  !!process.env.CLOUDINARY_CLOUD_NAME
);

console.log(
  "Cloudinary API Key:",
  !!process.env.CLOUDINARY_API_KEY
);

console.log(
  "Cloudinary API Secret:",
  !!process.env.CLOUDINARY_API_SECRET
);

// ========================================
// HOME ROUTE
// ========================================
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to C-MART API",
  });
});

// ========================================
// HEALTH CHECK
// ========================================
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "C-MART Backend Running Successfully",
    timestamp: new Date().toISOString(),
  });
});

// ========================================
// AUTHENTICATION
// ========================================
app.use("/api/auth", authRoutes);

// ========================================
// ADMIN
// ========================================
app.use("/api/admin", adminRoutes);

// ========================================
// PRODUCTS - BUY / SELL
// ========================================
app.use("/api/products", productRoutes);

// ========================================
// IMAGE UPLOAD - CLOUDINARY
// ========================================
// Routes are defined inside uploadRoutes.js
//
// POST /api/upload
// POST /api/upload/image
//
// Both work if uploadRoutes.js has both
// router.post("/", ...) and
// router.post("/image", ...).
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
// Existing routes are handled by swapRoutes.js
app.use("/api/swap", swapRoutes);

// Backward compatibility
app.use("/api/swaps", swapRoutes);

// ========================================
// BARGAINING
// ========================================
app.use("/api/bargain", bargainingRoutes);
app.use("/api/bargaining", bargainingRoutes);

// ========================================
// COMPLAINTS
// ========================================
app.use("/api/complaints", complaintRoutes);

// ========================================
// REPORTS
// ========================================
if (reportRoutes) {
  app.use("/api/reports", reportRoutes);
  console.log("Reports API connected");
} else {
  console.log("Reports API file not found");
}

// ========================================
// UNKNOWN API ENDPOINT
// ========================================
app.use("/api", (req, res) => {
  res.status(404).json({
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
  console.error("Server Error:", err);

  if (res.headersSent) {
    return next(err);
  }

  const statusCode =
    Number.isInteger(err.status) &&
    err.status >= 400 &&
    err.status < 600
      ? err.status
      : 500;

  res.status(statusCode).json({
    success: false,
    message:
      process.env.NODE_ENV === "production" &&
      statusCode === 500
        ? "Internal server error"
        : err.message || "Internal server error",
  });
});

// ========================================
// START SERVER
// ========================================
const startServer = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error(
        "MONGO_URI missing in server/.env"
      );
    }

    if (!process.env.JWT_SECRET) {
      throw new Error(
        "JWT_SECRET missing in server/.env"
      );
    }

    console.log("Connecting to MongoDB...");

    await connectDB();

    console.log("MongoDB connection step completed");

    app.listen(PORT, () => {
      console.log("==================================");
      console.log("       C-MART SERVER STARTED");
      console.log("==================================");

      console.log(
        `Server: http://localhost:${PORT}`
      );

      console.log(
        `Health: http://localhost:${PORT}/api/health`
      );

      console.log("Authentication API connected");
      console.log("Products API connected");
      console.log("Upload API mounted");
      console.log("Swap API mounted");
      console.log("Orders API connected");
      console.log("Admin API connected");

      console.log("==================================");
    });
  } catch (error) {
    console.error(
      "C-MART startup failed:",
      error.message
    );

    process.exit(1);
  }
};

startServer();
