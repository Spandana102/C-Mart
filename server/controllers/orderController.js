
const mongoose = require("mongoose");

const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");

// ==========================================
// HELPER - GET LOGGED-IN USER ID
// ==========================================

const getLoggedInUserId = (req) => {
  return req.user?.id || req.user?._id || null;
};

// ==========================================
// HELPER - GET PRODUCT SELLER ID
// ==========================================

const getProductSellerId = (product) => {
  const seller =
    product.sellerId ||
    product.seller ||
    product.owner;

  if (!seller) return null;

  if (typeof seller === "object" && seller._id) {
    return seller._id;
  }

  return seller;
};

// ==========================================
// HELPER - CHECK BLOCKED USER
// ==========================================

const isBlocked = (user) => {
  return (
    user?.status === "Blocked" ||
    user?.isBlocked === true
  );
};

// ==========================================
// CREATE ORDER
// POST /api/orders
// ==========================================

const createOrder = async (req, res) => {
  try {
    const buyerId = getLoggedInUserId(req);

    if (!buyerId || !mongoose.isValidObjectId(buyerId)) {
      return res.status(401).json({
        success: false,
        message: "Please login to place an order.",
      });
    }

    const buyer = await User.findById(buyerId);

    if (!buyer) {
      return res.status(401).json({
        success: false,
        message: "Buyer account not found.",
      });
    }

    if (isBlocked(buyer)) {
      return res.status(403).json({
        success: false,
        message: "Your account is blocked.",
      });
    }

    const {
      productId,
      quantity = 1,
      meetPoint,
      meetingDate,
      meetingTime,
    } = req.body || {};

    // Validate product ID
    if (
      !productId ||
      !mongoose.isValidObjectId(productId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid product ID is required.",
      });
    }

    // Validate quantity
    const orderQuantity = Number(quantity);

    if (
      !Number.isInteger(orderQuantity) ||
      orderQuantity < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid order quantity.",
      });
    }

    // Validate meet point
    const allowedMeetPoints = [
      "College Main Gate",
      "College Library",
      "College Canteen",
      "College Ground",
    ];

    if (!allowedMeetPoints.includes(meetPoint)) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid meet point.",
      });
    }

    // Validate meeting date and time
    if (
      typeof meetingDate !== "string" ||
      typeof meetingTime !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(meetingDate) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(meetingTime)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid meeting date and time are required.",
      });
    }

    const meetingDateTime = new Date(
      `${meetingDate}T${meetingTime}:00`
    );

    if (
      Number.isNaN(meetingDateTime.getTime()) ||
      meetingDateTime <= new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "Meeting date and time must be in the future.",
      });
    }

    // Fetch product from database
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    // Seller must come from database
    const sellerId = getProductSellerId(product);

    if (
      !sellerId ||
      !mongoose.isValidObjectId(sellerId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Seller information is missing for this product.",
      });
    }

    // Prevent buying own product
    if (String(sellerId) === String(buyerId)) {
      return res.status(400).json({
        success: false,
        message: "You cannot buy your own product.",
      });
    }

    const seller = await User.findById(sellerId);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller account not found.",
      });
    }

    if (isBlocked(seller)) {
      return res.status(403).json({
        success: false,
        message: "This seller is currently unavailable.",
      });
    }

    // Validate stock if product has stock field
    if (
      product.stock != null &&
      Number(product.stock) < orderQuantity
    ) {
      return res.status(400).json({
        success: false,
        message: "Insufficient product stock.",
      });
    }

    const productPrice = Number(product.price);

    if (
      !Number.isFinite(productPrice) ||
      productPrice <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Product price is invalid.",
      });
    }

    // Create order
    const order = await Order.create({
      buyer: buyerId,
      seller: sellerId,
      product: product._id,
      productName:
        product.name ||
        product.title ||
        "Product",
      price: productPrice,
      quantity: orderQuantity,
      meetPoint,
      meetingDate,
      meetingTime,
      status: "Processing",
    });

    const savedOrder = await Order.findById(order._id)
      .populate("product", "name title images price")
      .populate("seller", "fullName");

    return res.status(201).json({
      success: true,
      message: "Ordered Successfully!",
      order: savedOrder,
    });

  } catch (error) {
    console.error("Create Order Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create order.",
    });
  }
};

// ==========================================
// GET BUYER ORDERS
// GET /api/orders/my
// GET /api/orders/user/:buyer
// ==========================================

const getUserOrders = async (req, res) => {
  try {
    const buyerId = getLoggedInUserId(req);

    if (!buyerId || !mongoose.isValidObjectId(buyerId)) {
      return res.status(401).json({
        success: false,
        message: "Please login to view orders.",
      });
    }

    // Old route compatibility
    if (
      req.params.buyer &&
      String(req.params.buyer) !== String(buyerId)
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only view your own orders.",
      });
    }

    const orders = await Order.find({
      buyer: buyerId,
    })
      .populate("product")
      .populate("seller", "fullName")
      .sort({ createdAt: -1 });

    // Keep array response for existing Orders.jsx
    return res.status(200).json(orders);

  } catch (error) {
    console.error("Get Buyer Orders Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get orders.",
    });
  }
};

// ==========================================
// GET SELLER RECEIVED ORDERS
// GET /api/orders/seller
// ==========================================

const getSellerOrders = async (req, res) => {
  try {
    const sellerId = getLoggedInUserId(req);

    if (!sellerId || !mongoose.isValidObjectId(sellerId)) {
      return res.status(401).json({
        success: false,
        message: "Please login to view received orders.",
      });
    }

    const orders = await Order.find({
      seller: sellerId,
    })
      .populate(
        "buyer",
        "fullName email collegeId"
      )
      .populate(
        "product",
        "name title images price"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });

  } catch (error) {
    console.error("Get Seller Orders Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get received orders.",
    });
  }
};

// ==========================================
// UPDATE ORDER STATUS - SELLER ONLY
// PATCH /api/orders/:id/status
// ==========================================

const updateOrderStatus = async (req, res) => {
  try {
    const sellerId = getLoggedInUserId(req);
    const orderId = req.params.id || req.params.orderId;
    const { status } = req.body || {};

    if (!sellerId || !mongoose.isValidObjectId(sellerId)) {
      return res.status(401).json({
        success: false,
        message: "Please login again.",
      });
    }

    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    const allowedStatuses = [
      "Processing",
      "Confirmed",
      "Delivered",
      "Cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status.",
      });
    }

    // Only seller who owns the order can update it
    const order = await Order.findOne({
      _id: orderId,
      seller: sellerId,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found or access denied.",
      });
    }

    // Prevent changing a completed/cancelled order
    if (
      order.status === "Delivered" ||
      order.status === "Cancelled"
    ) {
      return res.status(400).json({
        success: false,
        message: "This order can no longer be updated.",
      });
    }

    // Validate allowed transitions
    const allowedTransitions = {
      Processing: ["Confirmed", "Cancelled"],
      Confirmed: ["Delivered", "Cancelled"],
    };

    if (
      !allowedTransitions[order.status]?.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status transition.",
      });
    }

    order.status = status;
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully.",
      order,
    });

  } catch (error) {
    console.error("Update Order Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update order status.",
    });
  }
};

// ==========================================
// EXPORT CONTROLLERS
// ==========================================

module.exports = {
  createOrder,
  getUserOrders,
  getSellerOrders,
  updateOrderStatus,
};
