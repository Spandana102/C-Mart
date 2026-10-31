
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;

const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");

// ==========================================
// CLOUDINARY CONFIGURATION
// ==========================================

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ==========================================
// HELPERS
// ==========================================

const getLoggedInUserId = (req) =>
  req.user?.id || req.user?._id || null;

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

const isBlocked = (user) =>
  user?.status === "Blocked" ||
  user?.isBlocked === true;

const sendError = (res, status, message) =>
  res.status(status).json({
    success: false,
    message,
  });

const isValidUserId = (id) =>
  id && mongoose.isValidObjectId(id);

const allowedMeetPoints = [
  "College Main Gate",
  "College Library",
  "College Canteen",
  "College Ground",
];

// ==========================================
// UPLOAD IMAGE TO CLOUDINARY
// ==========================================

const uploadToCloudinary = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "c-mart/payment-proofs",
        resource_type: "image",
        overwrite: false,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.end(buffer);
  });

// ==========================================
// CREATE ORDER
// POST /api/orders
// ==========================================

const createOrder = async (req, res) => {
  try {
    const buyerId = getLoggedInUserId(req);

    if (!isValidUserId(buyerId)) {
      return sendError(
        res, 401, "Please login to place an order."
      );
    }

    const buyer = await User.findById(buyerId);

    if (!buyer || isBlocked(buyer)) {
      return sendError(
        res, 403, "Buyer account is unavailable."
      );
    }

    const {
      productId,
      quantity = 1,
      meetPoint,
      meetingDate,
      meetingTime,
      paymentMethod = "UPI",
    } = req.body || {};

    if (!mongoose.isValidObjectId(productId)) {
      return sendError(
        res, 400, "Valid product ID is required."
      );
    }

    const orderQuantity = Number(quantity);

    if (
      !Number.isInteger(orderQuantity) ||
      orderQuantity < 1
    ) {
      return sendError(
        res, 400, "Invalid order quantity."
      );
    }

    if (!allowedMeetPoints.includes(meetPoint)) {
      return sendError(
        res, 400, "Please select a valid meet point."
      );
    }

    if (
      typeof meetingDate !== "string" ||
      typeof meetingTime !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(meetingDate) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(meetingTime)
    ) {
      return sendError(
        res, 400, "Valid meeting date and time required."
      );
    }

    const meetingDateTime = new Date(
      `${meetingDate}T${meetingTime}:00`
    );

    if (
      Number.isNaN(meetingDateTime.getTime()) ||
      meetingDateTime <= new Date() ||
      meetingDateTime.getFullYear() !==
        Number(meetingDate.slice(0, 4)) ||
      meetingDateTime.getMonth() + 1 !==
        Number(meetingDate.slice(5, 7)) ||
      meetingDateTime.getDate() !==
        Number(meetingDate.slice(8, 10))
    ) {
      return sendError(
        res, 400, "Meeting date and time must be valid and in the future."
      );
    }

    if (!["UPI", "Cash", "Other"].includes(paymentMethod)) {
      return sendError(
        res, 400, "Invalid payment method."
      );
    }

    const product = await Product.findById(productId);

    if (!product) {
      return sendError(
        res, 404, "Product not found."
      );
    }

    const sellerId = getProductSellerId(product);

    if (!isValidUserId(sellerId)) {
      return sendError(
        res, 400, "Seller information is missing."
      );
    }

    if (String(sellerId) === String(buyerId)) {
      return sendError(
        res, 400, "You cannot buy your own product."
      );
    }

    const seller = await User.findById(sellerId);

    if (!seller || isBlocked(seller)) {
      return sendError(
        res, 403, "Seller account is unavailable."
      );
    }

    if (
      product.stock != null &&
      Number(product.stock) < orderQuantity
    ) {
      return sendError(
        res, 400, "Insufficient product stock."
      );
    }

    const productPrice = Number(product.price);

    if (
      !Number.isFinite(productPrice) ||
      productPrice <= 0
    ) {
      return sendError(
        res, 400, "Product price is invalid."
      );
    }

    const order = await Order.create({
      buyer: buyerId,
      seller: sellerId,
      product: product._id,
      productName:
        product.name || product.title || "Product",
      price: productPrice,
      quantity: orderQuantity,
      meetPoint,
      meetingDate,
      meetingTime,
      paymentMethod,
      paymentStatus: "Not Submitted",
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
    return sendError(res, 500, "Failed to create order.");
  }
};

// ==========================================
// GET BUYER ORDERS
// ==========================================

const getUserOrders = async (req, res) => {
  try {
    const buyerId = getLoggedInUserId(req);

    if (!isValidUserId(buyerId)) {
      return sendError(
        res, 401, "Please login to view orders."
      );
    }

    if (
      req.params.buyer &&
      String(req.params.buyer) !== String(buyerId)
    ) {
      return sendError(
        res, 403, "You can only view your own orders."
      );
    }

    const orders = await Order.find({
      buyer: buyerId,
    })
      .populate("product")
      .populate("seller", "fullName")
      .sort({ createdAt: -1 });

    // Preserve existing frontend response format
    return res.status(200).json(orders);

  } catch (error) {
    console.error("Get Buyer Orders Error:", error);
    return sendError(res, 500, "Failed to get orders.");
  }
};

// ==========================================
// GET SELLER ORDERS
// ==========================================

const getSellerOrders = async (req, res) => {
  try {
    const sellerId = getLoggedInUserId(req);

    if (!isValidUserId(sellerId)) {
      return sendError(
        res, 401, "Please login to view received orders."
      );
    }

    const orders = await Order.find({
      seller: sellerId,
    })
      .populate("buyer", "fullName email collegeId")
      .populate("product", "name title images price")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });

  } catch (error) {
    console.error("Get Seller Orders Error:", error);
    return sendError(
      res, 500, "Failed to get received orders."
    );
  }
};

// ==========================================
// UPLOAD PAYMENT SCREENSHOT - BUYER ONLY
// POST /api/orders/:id/payment-proof
// ==========================================

const uploadPaymentProof = async (req, res) => {
  try {
    const buyerId = getLoggedInUserId(req);
    const orderId = req.params.id;

    if (!isValidUserId(buyerId)) {
      return sendError(res, 401, "Please login again.");
    }

    if (!mongoose.isValidObjectId(orderId)) {
      return sendError(res, 400, "Invalid order ID.");
    }

    if (!req.file?.buffer) {
      return sendError(
        res, 400, "Please select a payment screenshot."
      );
    }

    // Check image file signature, not only MIME type
    const buffer = req.file.buffer;
    const isJPEG =
      buffer.length >= 3 &&
      buffer.subarray(0, 3).equals(
        Buffer.from([0xff, 0xd8, 0xff])
      );
    const isPNG =
      buffer.length >= 8 &&
      buffer.subarray(0, 8).equals(
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
      );
    const isWebP =
      buffer.length >= 12 &&
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP";

    if (!isJPEG && !isPNG && !isWebP) {
      return sendError(
        res, 400, "Invalid image file."
      );
    }

    const order = await Order.findOne({
      _id: orderId,
      buyer: buyerId,
    });

    if (!order) {
      return sendError(
        res, 404, "Order not found or access denied."
      );
    }

    if (
      order.status === "Cancelled" ||
      order.status === "Delivered"
    ) {
      return sendError(
        res, 400, "Cannot upload proof for this order."
      );
    }

    if (
      !["Not Submitted", "Rejected"].includes(
        order.paymentStatus || "Not Submitted"
      )
    ) {
      return sendError(
        res, 400, "Payment proof is already submitted."
      );
    }

    const result = await uploadToCloudinary(buffer);

    if (!result?.secure_url || !result?.public_id) {
      return sendError(
        res, 500, "Payment image upload failed."
      );
    }

    const updatedOrder = await Order.findOneAndUpdate(
      {
        _id: orderId,
        buyer: buyerId,
        status: { $nin: ["Cancelled", "Delivered"] },
        paymentStatus: {
          $in: ["Not Submitted", "Rejected"],
        },
      },
      {
        $set: {
          paymentScreenshot: result.secure_url,
          paymentScreenshotPublicId: result.public_id,
          paymentStatus: "Pending",
          paymentSubmittedAt: new Date(),
          paymentVerifiedAt: null,
          paymentVerifiedBy: null,
          paymentRejectionReason: "",
        },
      },
      { new: true }
    );

    if (!updatedOrder) {
      // Remove image if order state changed during upload
      await cloudinary.uploader.destroy(result.public_id)
        .catch((error) => {
          console.error("Cloudinary cleanup:", error);
        });

      return sendError(
        res, 409, "Order changed. Please refresh and retry."
      );
    }

    return res.status(200).json({
      success: true,
      message: "Payment proof submitted for verification.",
      order: updatedOrder,
    });

  } catch (error) {
    console.error("Payment Upload Error:", error);
    return sendError(
      res, 500, "Failed to upload payment proof."
    );
  }
};

// ==========================================
// VERIFY / REJECT PAYMENT - SELLER ONLY
// PATCH /api/orders/:id/payment-status
// ==========================================

const updatePaymentStatus = async (req, res) => {
  try {
    const sellerId = getLoggedInUserId(req);
    const orderId = req.params.id;
    const { status, reason = "" } = req.body || {};

    if (!isValidUserId(sellerId)) {
      return sendError(res, 401, "Please login again.");
    }

    if (!mongoose.isValidObjectId(orderId)) {
      return sendError(res, 400, "Invalid order ID.");
    }

    if (!["Verified", "Rejected"].includes(status)) {
      return sendError(
        res, 400, "Status must be Verified or Rejected."
      );
    }

    if (
      typeof reason !== "string" ||
      reason.length > 500
    ) {
      return sendError(
        res, 400, "Invalid rejection reason."
      );
    }

    const order = await Order.findOneAndUpdate(
      {
        _id: orderId,
        seller: sellerId,
        paymentStatus: "Pending",
        paymentScreenshot: { $nin: ["", null] },
        status: { $nin: ["Cancelled", "Delivered"] },
      },
      {
        $set: {
          paymentStatus: status,
          paymentVerifiedAt:
            status === "Verified" ? new Date() : null,
          paymentVerifiedBy:
            status === "Verified" ? sellerId : null,
          paymentRejectionReason:
            status === "Rejected" ? reason.trim() : "",
        },
      },
      { new: true }
    );

    if (!order) {
      return sendError(
        res,
        409,
        "Order unavailable, access denied, or payment is not pending."
      );
    }

    return res.status(200).json({
      success: true,
      message:
        status === "Verified"
          ? "Payment verified successfully."
          : "Payment proof rejected.",
      order,
    });

  } catch (error) {
    console.error("Payment Verification Error:", error);
    return sendError(
      res, 500, "Failed to update payment status."
    );
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

    if (!isValidUserId(sellerId)) {
      return sendError(res, 401, "Please login again.");
    }

    if (!mongoose.isValidObjectId(orderId)) {
      return sendError(res, 400, "Invalid order ID.");
    }

    const allowedTransitions = {
      Processing: ["Confirmed", "Cancelled"],
      Confirmed: ["Delivered", "Cancelled"],
    };

    const order = await Order.findOne({
      _id: orderId,
      seller: sellerId,
    });

    if (!order) {
      return sendError(
        res, 404, "Order not found or access denied."
      );
    }

    if (
      !allowedTransitions[order.status]?.includes(status)
    ) {
      return sendError(
        res, 400, "Invalid order status transition."
      );
    }

    // A UPI order cannot be confirmed without
    // verified payment proof.
    if (
      paymentRequired(order) &&
      ["Confirmed", "Delivered"].includes(status) &&
      order.paymentStatus !== "Verified"
    ) {
      return sendError(
        res, 400, "Verify payment before confirming the order."
      );
    }

    const updatedOrder = await Order.findOneAndUpdate(
      {
        _id: orderId,
        seller: sellerId,
        status: order.status,
        ...(paymentRequired(order) &&
        ["Confirmed", "Delivered"].includes(status)
          ? { paymentStatus: "Verified" }
          : {}),
      },
      { $set: { status } },
      { new: true, runValidators: true }
    );

    if (!updatedOrder) {
      return sendError(
        res, 409, "Order changed. Refresh and retry."
      );
    }

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully.",
      order: updatedOrder,
    });

  } catch (error) {
    console.error("Update Order Status Error:", error);
    return sendError(
      res, 500, "Failed to update order status."
    );
  }
};

const paymentRequired = (order) =>
  (order.paymentMethod || "UPI") === "UPI";

// ==========================================
// EXPORT CONTROLLERS
// ==========================================

module.exports = {
  createOrder,
  getUserOrders,
  getSellerOrders,
  updateOrderStatus,
  uploadPaymentProof,
  updatePaymentStatus,
};
