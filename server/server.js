
const dns = require("dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);
dns.setDefaultResultOrder("ipv4first");

const express = require("express");
const cors = require("cors");
require("dotenv").config();

// ENV CHECK
console.log("JWT_SECRET loaded:", !!process.env.JWT_SECRET);
console.log(
  "Cloudinary Cloud Name loaded:",
  !!process.env.CLOUDINARY_CLOUD_NAME
);
console.log(
  "Cloudinary API Key loaded:",
  !!process.env.CLOUDINARY_API_KEY
);
console.log(
  "Cloudinary API Secret loaded:",
  !!process.env.CLOUDINARY_API_SECRET
);

// IMPORTS
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const productRoutes = require("./routes/productRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const orderRoutes = require("./routes/orderRoutes");
const swapRoutes = require("./routes/swapRoutes");

// APP
const app = express();

// MIDDLEWARE
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// DATABASE
connectDB();

// EXISTING ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/products", productRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/orders", orderRoutes);

// SWAP REQUEST ROUTES
app.use("/api/swaps", swapRoutes);

// HOME
app.get("/", (req, res) => {
  res.send("Campus Bazaar Backend is Running");
});

// SERVER
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});