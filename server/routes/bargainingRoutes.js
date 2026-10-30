
const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const Product = require("../models/Product");
const Bargain = require("../models/Bargain");
const authMiddleware = require("../middleware/authMiddleware");

const getUserId = (req) =>
  req.user?._id || req.user?.id || req.user?.userId;

const validId = (id) => mongoose.isValidObjectId(id);

const validPrice = (value) => {
  if (value === null || value === undefined || value === "") {
    return false;
  }

  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0;
};

// =====================================================
// 1. BUYER - SUBMIT BARGAIN OFFER
// POST /api/bargaining
// =====================================================

router.post("/", authMiddleware, async (req, res) => {
  try {
    const buyerId = getUserId(req);
    const { productId, offerPrice, message = "" } = req.body;

    if (!validId(buyerId)) {
      return res.status(401).json({
        success: false,
        message: "Please login again.",
      });
    }

    if (!validId(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    if (!validPrice(offerPrice)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid offer price.",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    if (!validId(product.sellerId)) {
      return res.status(400).json({
        success: false,
        message:
          "This product has no seller assigned. Please contact the administrator.",
      });
    }

    if (String(product.sellerId) === String(buyerId)) {
      return res.status(400).json({
        success: false,
        message: "You cannot bargain on your own product.",
      });
    }

    const amount = Number(offerPrice);

    if (amount >= Number(product.price)) {
      return res.status(400).json({
        success: false,
        message: "Offer must be lower than the listed price.",
      });
    }

    // Avoid duplicate pending requests for same product
    const existingOffer = await Bargain.findOne({
      productId: product._id,
      buyerId,
      status: "Pending",
    });

    if (existingOffer) {
      return res.status(409).json({
        success: false,
        message:
          "You already have a pending offer for this product.",
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
      message: "Bargaining offer submitted successfully.",
      bargain,
    });
  } catch (error) {
    console.error("Submit bargain error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit bargaining offer.",
    });
  }
});

// =====================================================
// 2. SELLER - GET INCOMING OFFERS
// GET /api/bargaining/seller
// =====================================================

router.get("/seller", authMiddleware, async (req, res) => {
  try {
    const sellerId = getUserId(req);

    if (!validId(sellerId)) {
      return res.status(401).json({
        success: false,
        message: "Please login again.",
      });
    }

    const offers = await Bargain.find({
      sellerId,
    })
      .populate(
        "productId",
        "name price mrp images category condition"
      )
      .populate("buyerId", "fullName email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: offers.length,
      offers,
    });
  } catch (error) {
    console.error("Seller offers error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch seller offers.",
    });
  }
});

// =====================================================
// 3. BUYER - GET MY SUBMITTED OFFERS
// GET /api/bargaining/buyer
// =====================================================

router.get("/buyer", authMiddleware, async (req, res) => {
  try {
    const buyerId = getUserId(req);

    if (!validId(buyerId)) {
      return res.status(401).json({
        success: false,
        message: "Please login again.",
      });
    }

    const offers = await Bargain.find({
      buyerId,
    })
      .populate(
        "productId",
        "name price images category"
      )
      .populate("sellerId", "fullName")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: offers.length,
      offers,
    });
  } catch (error) {
    console.error("Buyer offers error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch buyer offers.",
    });
  }
});

// =====================================================
// 4. SELLER - ACCEPT OFFER
// PATCH /api/bargaining/:id/accept
// =====================================================

router.patch("/:id/accept", authMiddleware, async (req, res) => {
  try {
    const sellerId = getUserId(req);

    if (!validId(sellerId)) {
      return res.status(401).json({
        success: false,
        message: "Please login again.",
      });
    }

    if (!validId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid offer ID.",
      });
    }

    const offer = await Bargain.findOneAndUpdate(
      {
        _id: req.params.id,
        sellerId,
        status: "Pending",
      },
      {
        $set: {
          status: "Accepted",
        },
      },
      { new: true, runValidators: true }
    );

    if (!offer) {
      return res.status(404).json({
        success: false,
        message:
          "Pending offer not found or you are not the seller.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Offer accepted successfully.",
      offer,
    });
  } catch (error) {
    console.error("Accept offer error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to accept offer.",
    });
  }
});

// =====================================================
// 5. SELLER - REJECT OFFER
// PATCH /api/bargaining/:id/reject
// =====================================================

router.patch("/:id/reject", authMiddleware, async (req, res) => {
  try {
    const sellerId = getUserId(req);

    if (!validId(sellerId)) {
      return res.status(401).json({
        success: false,
        message: "Please login again.",
      });
    }

    if (!validId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid offer ID.",
      });
    }

    const offer = await Bargain.findOneAndUpdate(
      {
        _id: req.params.id,
        sellerId,
        status: "Pending",
      },
      {
        $set: {
          status: "Rejected",
        },
      },
      { new: true, runValidators: true }
    );

    if (!offer) {
      return res.status(404).json({
        success: false,
        message:
          "Pending offer not found or you are not the seller.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Offer rejected successfully.",
      offer,
    });
  } catch (error) {
    console.error("Reject offer error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to reject offer.",
    });
  }
});

// =====================================================
// 6. SELLER - SEND COUNTER OFFER
// PATCH /api/bargaining/:id/counter
// =====================================================

router.patch("/:id/counter", authMiddleware, async (req, res) => {
  try {
    const sellerId = getUserId(req);

    if (!validId(sellerId)) {
      return res.status(401).json({
        success: false,
        message: "Please login again.",
      });
    }

    if (!validId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid offer ID.",
      });
    }

    if (!validPrice(req.body.counterPrice)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid counter price.",
      });
    }

    const offer = await Bargain.findOne({
      _id: req.params.id,
      sellerId,
      status: "Pending",
    });

    if (!offer) {
      return res.status(404).json({
        success: false,
        message:
          "Pending offer not found or you are not the seller.",
      });
    }

    const product = await Product.findById(offer.productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    const counterPrice = Number(req.body.counterPrice);

    if (
      counterPrice <= Number(offer.offerPrice) ||
      counterPrice >= Number(product.price)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Counter price must be higher than buyer offer and lower than listed price.",
      });
    }

    const updatedOffer = await Bargain.findOneAndUpdate(
      {
        _id: offer._id,
        sellerId,
        status: "Pending",
      },
      {
        $set: {
          counterPrice,
          status: "Countered",
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedOffer) {
      return res.status(409).json({
        success: false,
        message: "This offer has already been updated.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Counter offer sent successfully.",
      offer: updatedOffer,
    });
  } catch (error) {
    console.error("Counter offer error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send counter offer.",
    });
  }
});

// =====================================================
// 7. BUYER - ACCEPT SELLER COUNTER OFFER
// PATCH /api/bargaining/:id/buyer-accept
// =====================================================

router.patch(
  "/:id/buyer-accept",
  authMiddleware,
  async (req, res) => {
    try {
      const buyerId = getUserId(req);

      if (!validId(buyerId)) {
        return res.status(401).json({
          success: false,
          message: "Please login again.",
        });
      }

      if (!validId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid offer ID.",
        });
      }

      const offer = await Bargain.findOneAndUpdate(
        {
          _id: req.params.id,
          buyerId,
          status: "Countered",
        },
        {
          $set: {
            status: "Accepted",
          },
        },
        { new: true, runValidators: true }
      );

      if (!offer) {
        return res.status(404).json({
          success: false,
          message: "Counter offer not found.",
        });
      }

      return res.json({
        success: true,
        message: "Counter offer accepted.",
        offer,
      });
    } catch (error) {
      console.error("Buyer accept error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to accept counter offer.",
      });
    }
  }
);

// =====================================================
// 8. BUYER - REJECT SELLER COUNTER OFFER
// PATCH /api/bargaining/:id/buyer-reject
// =====================================================

router.patch(
  "/:id/buyer-reject",
  authMiddleware,
  async (req, res) => {
    try {
      const buyerId = getUserId(req);

      if (!validId(buyerId)) {
        return res.status(401).json({
          success: false,
          message: "Please login again.",
        });
      }

      if (!validId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid offer ID.",
        });
      }

      const offer = await Bargain.findOneAndUpdate(
        {
          _id: req.params.id,
          buyerId,
          status: "Countered",
        },
        {
          $set: {
            status: "Rejected",
          },
        },
        { new: true, runValidators: true }
      );

      if (!offer) {
        return res.status(404).json({
          success: false,
          message: "Counter offer not found.",
        });
      }

      return res.json({
        success: true,
        message: "Counter offer rejected.",
        offer,
      });
    } catch (error) {
      console.error("Buyer reject error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to reject counter offer.",
      });
    }
  }
);

module.exports = router;
