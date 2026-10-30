
const express = require("express");

const {
  createOrder,
  getUserOrders,
  getSellerOrders,
  updateOrderStatus,
} = require("../controllers/orderController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// ==========================================
// CREATE ORDER
// POST /api/orders
// Buyer confirms order after selecting meet point
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
// UPDATE ORDER STATUS
// PATCH /api/orders/:id/status
// Only seller can update order status
// ==========================================

router.patch(
  "/:id/status",
  authMiddleware,
  updateOrderStatus
);

module.exports = router;
