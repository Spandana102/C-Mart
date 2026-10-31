
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const User = require("../models/User");

const {
  getDashboardStats,
  getAllUsers,
  getAllProducts,
  deleteProduct,
} = require("../controllers/adminController");

// ==========================================
// PROTECT ALL ADMIN ROUTES
// ==========================================

router.use(authMiddleware);
router.use(adminMiddleware);

// ==========================================
// HELPERS
// ==========================================

const safeUser = (user) => ({
  _id: user._id,
  fullName: user.fullName,
  email: user.email,
  collegeId: user.collegeId,
  phoneNumber: user.phoneNumber,
  role: user.role,
  status: user.isBlocked === true ||
    String(user.status || "").toLowerCase() === "blocked"
      ? "Blocked"
      : "Active",
  isBlocked:
    user.isBlocked === true ||
    String(user.status || "").toLowerCase() === "blocked",
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const isBlocked = (user) =>
  user.isBlocked === true ||
  String(user.status || "").toLowerCase() === "blocked";

const getAdminId = (req) =>
  String(req.user?._id || req.user?.id || "");

const isValidId = (id) =>
  mongoose.isValidObjectId(id);

// ==========================================
// ADMIN DASHBOARD
// ==========================================

// GET /api/admin/dashboard
router.get("/dashboard", getDashboardStats);

// ==========================================
// MANAGE USERS
// ==========================================

// GET /api/admin/users
router.get("/users", getAllUsers);

// GET /api/admin/users/:id
router.get("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user: safeUser(user),
    });
  } catch (error) {
    console.error("Get User Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch user",
    });
  }
});

// ==========================================
// ADD NEW USER
// ==========================================

// POST /api/admin/users
router.post("/users", async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      phoneNumber,
    } = req.body || {};

    if (
      typeof fullName !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      typeof phoneNumber !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be valid strings",
      });
    }

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phoneNumber.trim();

    if (
      cleanName.length < 2 ||
      cleanName.length > 100 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) ||
      password.length < 8 ||
      !/^[0-9]{10}$/.test(cleanPhone)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Enter valid name, email, phone number and password of at least 8 characters",
      });
    }

    const existingUser = await User.findOne({
      email: cleanEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      12
    );

    const newUser = await User.create({
      fullName: cleanName,
      email: cleanEmail,
      password: hashedPassword,
      collegeId: "189",
      phoneNumber: cleanPhone,
      role: "user",
      status: "Active",
      isBlocked: false,
    });

    return res.status(201).json({
      success: true,
      message: "User added successfully",
      user: safeUser(newUser),
    });
  } catch (error) {
    console.error("Add User Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to add user",
    });
  }
});

// ==========================================
// BLOCK / UNBLOCK USER
// ==========================================

const changeUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    if (String(id) === getAdminId(req)) {
      return res.status(403).json({
        success: false,
        message: "You cannot block your own admin account",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Administrator accounts cannot be blocked",
      });
    }

    let nextBlocked;

    if (typeof req.body?.isBlocked === "boolean") {
      nextBlocked = req.body.isBlocked;
    } else if (typeof req.body?.status === "string") {
      const status = req.body.status.toLowerCase();

      if (!["active", "blocked"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Status must be Active or Blocked",
        });
      }

      nextBlocked = status === "blocked";
    } else {
      nextBlocked = !isBlocked(user);
    }

    user.isBlocked = nextBlocked;
    user.status = nextBlocked ? "Blocked" : "Active";

    await user.save();

    return res.status(200).json({
      success: true,
      message: nextBlocked
        ? "User blocked successfully"
        : "User unblocked successfully",
      user: safeUser(user),
    });
  } catch (error) {
    console.error("Update User Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update user status",
    });
  }
};

// Supports existing frontend and explicit updates
router.put("/users/:id/status", changeUserStatus);
router.patch("/users/:id/status", changeUserStatus);

// ==========================================
// DELETE USER
// ==========================================

// DELETE /api/admin/users/:id
router.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    if (String(id) === getAdminId(req)) {
      return res.status(403).json({
        success: false,
        message: "You cannot delete your own admin account",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Administrator accounts cannot be deleted",
      });
    }

    await User.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
      deletedUserId: id,
    });
  } catch (error) {
    console.error("Delete User Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
});

// ==========================================
// MANAGE PRODUCTS
// ==========================================

// GET /api/admin/products
router.get("/products", getAllProducts);

// DELETE /api/admin/products/:id
router.delete("/products/:id", deleteProduct);

module.exports = router;
