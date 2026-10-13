
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Product = require("../models/Product");
const Bargain = require("../models/Bargain");
const authMiddleware = require("../middleware/authMiddleware");

const getUserId = (req) =>
  req.user?._id || req.user?.id || req.user?.userId;

// Submit a buyer offer
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { productId, offerPrice, message = "" } = req.body;
    const buyerId = getUserId(req);

    if (!mongoose.isValidObjectId(buyerId)) {
      return res.status(401).json({
        message: "Unable to identify the logged-in user",
      });
    }

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

    if (!product.sellerId) {
      return res.status(400).json({
        message:
          "This product has no seller assigned. Update the product owner first.",
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
      message: String(message).trim().slice(0, 300),
      status: "Pending",
    });

    return res.status(201).json({
      success: true,
      message: "Bargaining offer submitted successfully",
      bargain,
    });
  } catch (error) {
    console.error("Submit bargaining offer:", error);

    return res.status(500).json({
      message: "Failed to submit bargaining offer",
    });
  }
});

// Get offers received by the logged-in seller
router.get("/seller", authMiddleware, async (req, res) => {
  try {
    const sellerId = getUserId(req);

    if (!mongoose.isValidObjectId(sellerId)) {
      return res.status(401).json({
        message: "Unable to identify the logged-in seller",
      });
    }

    const offers = await Bargain.find({ sellerId })
      .populate("productId", "name price images category")
      .populate("buyerId", "fullName email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      offers,
    });
  } catch (error) {
    console.error("Fetch seller offers:", error);

    return res.status(500).json({
      message: "Failed to fetch seller offers",
    });
  }
});

// Accept offer
router.patch("/:id/accept", authMiddleware, async (req, res) => {
  try {
    const sellerId = getUserId(req);

    if (!mongoose.isValidObjectId(sellerId)) {
      return res.status(401).json({
        message: "Please log in again",
      });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid offer ID",
      });
    }

    const offer = await Bargain.findOne({
      _id: req.params.id,
      sellerId,
      status: "Pending",
    });

    if (!offer) {
      return res.status(404).json({
        message:
          "Pending offer not found, or you are not its seller",
      });
    }

    offer.status = "Accepted";
    await offer.save();

    return res.json({
      success: true,
      message: "Offer accepted successfully",
      offer,
    });
  } catch (error) {
    console.error("Accept offer:", error);

    return res.status(500).json({
      message: "Failed to accept offer",
    });
  }
});

// Reject offer
router.patch("/:id/reject", authMiddleware, async (req, res) => {
  try {
    const sellerId = getUserId(req);

    if (!mongoose.isValidObjectId(sellerId)) {
      return res.status(401).json({
        message: "Please log in again",
      });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid offer ID",
      });
    }

    const offer = await Bargain.findOne({
      _id: req.params.id,
      sellerId,
      status: "Pending",
    });

    if (!offer) {
      return res.status(404).json({
        message:
          "Pending offer not found, or you are not its seller",
      });
    }

    offer.status = "Rejected";
    await offer.save();

    return res.json({
      success: true,
      message: "Offer rejected",
      offer,
    });
  } catch (error) {
    console.error("Reject offer:", error);

    return res.status(500).json({
      message: "Failed to reject offer",
    });
  }
});

// Seller sends a counter offer
router.patch("/:id/counter", authMiddleware, async (req, res) => {
  try {
    const sellerId = getUserId(req);

    if (!mongoose.isValidObjectId(sellerId)) {
      return res.status(401).json({
        message: "Please log in again",
      });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid offer ID",
      });
    }

    const counterPrice = Number(req.body.counterPrice);

    if (!Number.isFinite(counterPrice) || counterPrice <= 0) {
      return res.status(400).json({
        message: "Please enter a valid counter price",
      });
    }

    const offer = await Bargain.findOne({
      _id: req.params.id,
      sellerId,
      status: "Pending",
    });

    if (!offer) {
      return res.status(404).json({
        message:
          "Pending offer not found, or you are not its seller",
      });
    }

    const product = await Product.findById(offer.productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    if (counterPrice >= Number(product.price)) {
      return res.status(400).json({
        message:
          "Counter price must be lower than the listed product price",
      });
    }

    offer.counterPrice = counterPrice;
    offer.status = "Countered";

    await offer.save();

    return res.json({
      success: true,
      message: "Counter offer submitted successfully",
      offer,
    });
  } catch (error) {
    console.error("Counter offer:", error);

    return res.status(500).json({
      message: "Failed to submit counter offer",
    });
  }
});

module.exports = router;
