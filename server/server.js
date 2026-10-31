
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
// MIDDLEWARE
// ========================================

app.use(cors());

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
// PRODUCTS - BUY / SELL
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

// Backward compatibility
app.use("/api/swaps", swapRoutes);

// ========================================
// RENT MODULE
// ========================================

// GET    /api/rent/products
// POST   /api/rent/products
// GET    /api/rent/requests
// POST   /api/rent/requests
// PATCH  /api/rent/requests/:id/status

app.use("/api/rent", rentRoutes);

// ========================================
// BARGAINING MODULE
// ========================================

app.use("/api/bargain", bargainingRoutes);

// Backward compatibility
app.use("/api/bargaining", bargainingRoutes);

// ========================================
// COMPLAINTS MODULE
// ========================================

app.use("/api/complaints", complaintRoutes);

// ========================================
// NOTIFICATIONS MODULE
// ========================================

// GET    /api/notifications
// PATCH  /api/notifications/read-all
// PATCH  /api/notifications/:id/read
// DELETE /api/notifications/:id

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
    process.env.NODE_ENV === "production" &&
    statusCode === 500
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
    // Validate environment variables
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

    // Connect to MongoDB
    console.log("Connecting to MongoDB...");

    await connectDB();

    console.log(
      "MongoDB connection step completed"
    );

    // Start Express server
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

      console.log(
        "Authentication API connected"
      );

      console.log(
        "Admin API connected"
      );

      console.log(
        "Products API connected"
      );

      console.log(
        "Upload API mounted"
      );

      console.log(
        "Reviews API connected"
      );

      console.log(
        "Orders API connected"
      );

      console.log(
        "Swap API mounted"
      );

      console.log(
        "Rent API mounted"
      );

      console.log(
        "Bargaining API connected"
      );

      console.log(
        "Complaints API connected"
      );

      console.log(
        "Wishlist API mounted"
      );

      console.log(
        "Chat API mounted"
      );

      console.log(
        "Notifications API mounted"
      );

      console.log("==================================");
    });
  } catch (error) {
    console.error(
      "C-MART startup failed:",
      error.message
    );

    process.exitCode = 1;
  }
};

// ========================================
// RUN APPLICATION
// ========================================

startServer();
