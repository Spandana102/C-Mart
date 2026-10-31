
const express = require("express");
const mongoose = require("mongoose");

const Wishlist = require("../models/wishlist");
const Product = require("../models/Product");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// All wishlist routes require authentication
router.use(authMiddleware);

// ==========================================
// GET CURRENT LOGGED-IN USER ID
// ==========================================

function getUserId(req) {
  return req.user?._id || req.user?.id;
}

// ==========================================
// GET MY WISHLIST
// Only products explicitly saved by user
// ==========================================

router.get("/", async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user.",
      });
    }

    // Read ONLY wishlist records belonging
    // to the currently logged-in user.
    // Do NOT fetch all products here.

    const savedItems = await Wishlist.find({
      user: userId,
    })
      .populate("product")
      .sort({ createdAt: -1 })
      .lean();

    // Return only valid saved products
    const wishlistProducts = savedItems
      .filter((item) => item.product)
      .map((item) => item.product);

    console.log(
      "Wishlist GET:",
      "User:",
      String(userId),
      "Saved products:",
      wishlistProducts.length
    );

    return res.status(200).json({
      success: true,
      wishlist: wishlistProducts,
      count: wishlistProducts.length,
    });
  } catch (error) {
    console.error("Get Wishlist Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load wishlist.",
    });
  }
});

// ==========================================
// ADD PRODUCT TO MY WISHLIST
// Called ONLY when user clicks Add
// ==========================================

router.post("/:productId", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { productId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user.",
      });
    }

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    // Prevent duplicate saved products
    const existingItem = await Wishlist.findOne({
      user: userId,
      product: productId,
    });

    if (existingItem) {
      return res.status(200).json({
        success: true,
        alreadySaved: true,
        message: "Product already in your wishlist.",
      });
    }

    // Save only the selected product
    const savedItem = await Wishlist.create({
      user: userId,
      product: productId,
    });

    console.log(
      "Wishlist ADD:",
      "User:",
      String(userId),
      "Product:",
      productId
    );

    return res.status(201).json({
      success: true,
      message: "Product added to wishlist.",
      wishlistItemId: savedItem._id,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(200).json({
        success: true,
        alreadySaved: true,
        message: "Product already in your wishlist.",
      });
    }

    console.error("Add Wishlist Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to add product.",
    });
  }
});

// ==========================================
// REMOVE PRODUCT FROM MY WISHLIST
// ==========================================

router.delete("/:productId", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { productId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user.",
      });
    }

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    const deletedItem =
      await Wishlist.findOneAndDelete({
        user: userId,
        product: productId,
      });

    if (!deletedItem) {
      return res.status(404).json({
        success: false,
        message: "Product not found in wishlist.",
      });
    }

    console.log(
      "Wishlist REMOVE:",
      "User:",
      String(userId),
      "Product:",
      productId
    );

    return res.status(200).json({
      success: true,
      message: "Product removed from wishlist.",
    });
  } catch (error) {
    console.error("Remove Wishlist Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to remove product.",
    });
  }
});

module.exports = router;
