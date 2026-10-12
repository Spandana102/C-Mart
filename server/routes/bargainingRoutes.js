
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Product = require("../models/Product");
const Bargain = require("../models/Bargain");
const authMiddleware = require("../middleware/authMiddleware");

// Submit a bargaining offer
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { productId, offerPrice } = req.body;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    const amount = Number(offerPrice);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        message: "Please enter a valid offer price",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    const buyerId =
      req.user?._id || req.user?.id || req.user?.userId;

    if (!buyerId || !mongoose.isValidObjectId(buyerId)) {
      return res.status(401).json({
        message: "Unable to identify the logged-in user",
      });
    }

    if (!product.sellerId) {
      return res.status(400).json({
        message: "This product does not have a seller assigned",
      });
    }

    if (String(product.sellerId) === String(buyerId)) {
      return res.status(400).json({
        message: "You cannot bargain on your own product",
      });
    }

    if (amount >= Number(product.price)) {
      return res.status(400).json({
        message: "Offer price must be lower than the listed price",
      });
    }

    const bargain = await Bargain.create({
      productId: product._id,
      buyerId,
      sellerId: product.sellerId,
      offerPrice: amount,
      status: "Pending",
    });

    return res.status(201).json({
      success: true,
      message: "Bargaining offer submitted successfully",
      bargain,
    });
  } catch (error) {
    console.error("Submit bargaining offer:", error.message);

    return res.status(500).json({
      message: "Failed to submit bargaining offer",
    });
  }
});

// Get offers received by the logged-in seller
router.get("/seller", authMiddleware, async (req, res) => {
  try {
    const sellerId =
      req.user?._id || req.user?.id || req.user?.userId;

    if (!sellerId || !mongoose.isValidObjectId(sellerId)) {
      return res.status(401).json({
        message: "Unable to identify the logged-in seller",
      });
    }

    const offers = await Bargain.find({ sellerId })
      .populate("productId", "name price images")
      .populate("buyerId", "fullName email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      offers,
    });
  } catch (error) {
    console.error("Fetch seller offers:", error.message);

    return res.status(500).json({
      message: "Failed to fetch seller offers",
    });
  }
});

module.exports = router;