
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const Product = require("../models/Product");
const SwapRequest = require("../models/SwapRequest");

const router = express.Router();

// Verify logged-in user from JWT
const authenticateUser = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Please login to continue",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userId = decoded.id || decoded._id || decoded.userId;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({
        success: false,
        message: "Invalid login token",
      });
    }

    req.user = { id: userId };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired login token",
    });
  }
};

// BUYER: Send a swap request to product seller
router.post("/", authenticateUser, async (req, res) => {
  try {
    const { productId, offeredProductName, offeredProductDescription } =
      req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Valid product ID is required",
      });
    }

    if (!offeredProductName || !offeredProductName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Enter the product you want to offer",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (!product.sellerId) {
      return res.status(400).json({
        success: false,
        message:
          "This product has no seller assigned. Update the product owner first.",
      });
    }

    if (String(product.sellerId) === String(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: "You cannot send a swap request for your own product",
      });
    }

    const existingRequest = await SwapRequest.findOne({
      productId,
      buyerId: req.user.id,
      status: "Pending",
    });

    if (existingRequest) {
      return res.status(409).json({
        success: false,
        message: "You already have a pending request for this product",
      });
    }

    const swapRequest = await SwapRequest.create({
      productId: product._id,
      sellerId: product.sellerId,
      buyerId: req.user.id,
      offeredProductName: offeredProductName.trim(),
      offeredProductDescription: offeredProductDescription || "",
    });

    return res.status(201).json({
      success: true,
      message: "Swap request sent successfully",
      request: swapRequest,
    });
  } catch (error) {
    console.error("Create Swap Request Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send swap request",
    });
  }
});

// BUYER: View requests sent by the logged-in buyer
router.get("/mine", authenticateUser, async (req, res) => {
  try {
    const requests = await SwapRequest.find({ buyerId: req.user.id })
      .populate("productId")
      .sort({ createdAt: -1 });

    return res.json({ success: true, requests });
  } catch (error) {
    console.error("Fetch My Swap Requests Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch your swap requests",
    });
  }
});

// SELLER: View requests received for the seller's products
router.get("/received", authenticateUser, async (req, res) => {
  try {
    const requests = await SwapRequest.find({ sellerId: req.user.id })
      .populate("productId")
      .populate("buyerId", "fullName email")
      .sort({ createdAt: -1 });

    return res.json({ success: true, requests });
  } catch (error) {
    console.error("Fetch Received Swap Requests Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch received swap requests",
    });
  }
});

// SELLER: Accept or reject a received request
router.patch("/:id/status", authenticateUser, async (req, res) => {
  try {
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid swap request ID",
      });
    }

    if (!["Accepted", "Rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be Accepted or Rejected",
      });
    }

    const request = await SwapRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Swap request not found",
      });
    }

    if (String(request.sellerId) !== String(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: "Only the product seller can update this request",
      });
    }

    if (request.status !== "Pending") {
      return res.status(409).json({
        success: false,
        message: "This request has already been processed",
      });
    }

    request.status = status;
    await request.save();

    return res.json({
      success: true,
      message: `Swap request ${status.toLowerCase()} successfully`,
      request,
    });
  } catch (error) {
    console.error("Update Swap Request Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update swap request",
    });
  }
});

module.exports = router;