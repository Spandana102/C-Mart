
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const SwapProduct = require("../models/SwapProduct");
const SwapRequest = require("../models/SwapRequest");

const router = express.Router();

// ========================================
// AUTHENTICATION
// ========================================
const authenticateUser = (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Please login to continue",
      });
    }

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id || decoded._id || decoded.userId;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
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

const validId = (id) =>
  mongoose.Types.ObjectId.isValid(id);

// ========================================
// VALIDATE SWAP PRODUCT
// ========================================
const validateProduct = (body) => {
  const name = String(body.name || "").trim();
  const category = String(body.category || "").trim();
  const description = String(body.description || "").trim();
  const condition = body.condition || "Used";
  const image = String(body.image || "").trim();

  if (!name || !category) {
    return { error: "Product name and category are required" };
  }

  if (!["New", "Used"].includes(condition)) {
    return { error: "Condition must be New or Used" };
  }

  if (image && !/^https:\/\//i.test(image)) {
    return { error: "Please upload a valid HTTPS image" };
  }

  return {
    data: {
      name,
      category,
      description,
      condition,
      image,
    },
  };
};

// ========================================
// GET ALL SWAP PRODUCTS
// ========================================
router.get("/products", async (req, res) => {
  try {
    const products = await SwapProduct.find()
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Get Swap Products Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load swap products",
    });
  }
});

// ========================================
// ADD SWAP PRODUCT
// ========================================
router.post("/products", authenticateUser, async (req, res) => {
  try {
    const result = validateProduct(req.body);

    if (result.error) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    const product = await SwapProduct.create({
      ...result.data,
      sellerId: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Swap product added successfully",
      product,
    });
  } catch (error) {
    console.error("Add Swap Product Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add swap product",
    });
  }
});

// ========================================
// EDIT SWAP PRODUCT
// ========================================
router.put("/products/:id", authenticateUser, async (req, res) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await SwapProduct.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Swap product not found",
      });
    }

    if (String(product.sellerId) !== String(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: "Only the owner can edit this product",
      });
    }

    const result = validateProduct(req.body);

    if (result.error) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    Object.assign(product, result.data);
    await product.save();

    return res.json({
      success: true,
      message: "Swap product updated successfully",
      product,
    });
  } catch (error) {
    console.error("Edit Swap Product Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update swap product",
    });
  }
});

// ========================================
// DELETE SWAP PRODUCT
// ========================================
router.delete("/products/:id", authenticateUser, async (req, res) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await SwapProduct.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Swap product not found",
      });
    }

    if (String(product.sellerId) !== String(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: "Only the owner can delete this product",
      });
    }

    await product.deleteOne();

    // Remove requests linked to deleted product
    await SwapRequest.deleteMany({
      productId: product._id,
    });

    return res.json({
      success: true,
      message: "Swap product deleted successfully",
    });
  } catch (error) {
    console.error("Delete Swap Product Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete swap product",
    });
  }
});

// ========================================
// SEND SWAP REQUEST
// ========================================
const createSwapRequest = async (req, res) => {
  try {
    const {
      productId,
      offeredProductName,
      offeredProductDescription,
    } = req.body;

    if (!validId(productId)) {
      return res.status(400).json({
        success: false,
        message: "Valid product ID is required",
      });
    }

    if (
      typeof offeredProductName !== "string" ||
      !offeredProductName.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter your offered product name",
      });
    }

    const product = await SwapProduct.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Swap product not found",
      });
    }

    if (String(product.sellerId) === String(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: "You cannot swap your own product",
      });
    }

    const existing = await SwapRequest.findOne({
      productId,
      buyerId: req.user.id,
      status: "Pending",
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "You already sent a pending request",
      });
    }

    const request = await SwapRequest.create({
      productId: product._id,
      sellerId: product.sellerId,
      buyerId: req.user.id,
      offeredProductName: offeredProductName.trim(),
      offeredProductDescription:
        String(offeredProductDescription || "").trim(),
      status: "Pending",
    });

    return res.status(201).json({
      success: true,
      message: "Swap request sent successfully",
      request,
    });
  } catch (error) {
    console.error("Create Swap Request Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send swap request",
    });
  }
};

// New frontend URL
router.post("/requests", authenticateUser, createSwapRequest);

// Old frontend URL
router.post("/", authenticateUser, createSwapRequest);

// ========================================
// GET SENT AND RECEIVED REQUESTS
// ========================================
router.get("/requests", authenticateUser, async (req, res) => {
  try {
    const requests = await SwapRequest.find({
      $or: [
        { buyerId: req.user.id },
        { sellerId: req.user.id },
      ],
    })
      .populate("productId")
      .populate("buyerId", "fullName email")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error("Get Swap Requests Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch swap requests",
    });
  }
});

// BUYER: MY SENT REQUESTS
router.get("/mine", authenticateUser, async (req, res) => {
  try {
    const requests = await SwapRequest.find({
      buyerId: req.user.id,
    })
      .populate("productId")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error("My Swap Requests Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch your requests",
    });
  }
});

// SELLER: RECEIVED REQUESTS
router.get("/received", authenticateUser, async (req, res) => {
  try {
    const requests = await SwapRequest.find({
      sellerId: req.user.id,
    })
      .populate("productId")
      .populate("buyerId", "fullName email")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error("Received Swap Requests Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch received requests",
    });
  }
});

// ========================================
// ACCEPT / REJECT SWAP REQUEST
// ========================================
const updateRequestStatus = async (req, res) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid swap request ID",
      });
    }

    const { status } = req.body;

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
        message: "Only the seller can update this request",
      });
    }

    if (request.status !== "Pending") {
      return res.status(409).json({
        success: false,
        message: "Request already processed",
      });
    }

    request.status = status;
    await request.save();

    return res.json({
      success: true,
      message: `Swap request ${status.toLowerCase()}`,
      request,
    });
  } catch (error) {
    console.error("Update Swap Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update request status",
    });
  }
};

// New frontend URL
router.patch(
  "/requests/:id/status",
  authenticateUser,
  updateRequestStatus
);

// Old frontend URL
router.patch(
  "/:id/status",
  authenticateUser,
  updateRequestStatus
);

module.exports = router;
