const express = require("express");

const {
  createOrder,
  getUserOrders,
} = require("../controllers/orderController");

const router = express.Router();

// Create a new order
router.post("/", createOrder);

// Get orders of a student
router.get("/user/:buyer", getUserOrders);

module.exports = router;