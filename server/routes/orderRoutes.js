
const express = require("express");
const multer = require("multer");

const {
  createOrder,
  getUserOrders,
  getSellerOrders,
  updateOrderStatus,
  uploadPaymentProof,
  updatePaymentStatus,
} = require("../controllers/orderController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// ==========================================
// PAYMENT SCREENSHOT UPLOAD CONFIGURATION
// ==========================================

const allowedTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
    fields: 5,
  },

  fileFilter: (req, file, cb) => {
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(
        new Error(
          "Only JPG, PNG and WebP images are allowed."
        )
      );
    }

    cb(null, true);
  },
});

// Handle payment upload errors
const uploadPaymentMiddleware = (req, res, next) => {
  upload.single("screenshot")(req, res, (err) => {
    if (err) {
      let statusCode = 400;
      let message = err.message;

      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          statusCode = 413;
          message = "Screenshot must be 5 MB or smaller.";
        } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
          message = "Upload only one screenshot.";
        }
      }

      return res.status(statusCode).json({
        success: false,
        message,
      });
    }

    next();
  });
};

// ==========================================
// CREATE ORDER
// POST /api/orders
// ==========================================

router.post(
  "/",
  authMiddleware,
  createOrder
);

// ==========================================
// GET LOGGED-IN BUYER ORDERS
// GET /api/orders/my
// ==========================================

router.get(
  "/my",
  authMiddleware,
  getUserOrders
);

// ==========================================
// GET SELLER RECEIVED ORDERS
// GET /api/orders/seller
// ==========================================

router.get(
  "/seller",
  authMiddleware,
  getSellerOrders
);

// ==========================================
// EXISTING BUYER ORDERS ROUTE
// GET /api/orders/user/:buyer
// ==========================================

router.get(
  "/user/:buyer",
  authMiddleware,
  (req, res, next) => {
    const loggedInUserId = String(
      req.user?.id || req.user?._id || ""
    );

    if (
      !loggedInUserId ||
      loggedInUserId !== String(req.params.buyer)
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only view your own orders.",
      });
    }

    return getUserOrders(req, res, next);
  }
);

// ==========================================
// UPLOAD PAYMENT SCREENSHOT - BUYER
// POST /api/orders/:id/payment-proof
// ==========================================

router.post(
  "/:id/payment-proof",
  authMiddleware,
  uploadPaymentMiddleware,
  uploadPaymentProof
);

// ==========================================
// VERIFY OR REJECT PAYMENT - SELLER
// PATCH /api/orders/:id/payment-status
// ==========================================

router.patch(
  "/:id/payment-status",
  authMiddleware,
  updatePaymentStatus
);

// ==========================================
// UPDATE ORDER STATUS - SELLER
// PATCH /api/orders/:id/status
// ==========================================

router.patch(
  "/:id/status",
  authMiddleware,
  updateOrderStatus
);

module.exports = router;
