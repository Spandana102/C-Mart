
const mongoose = require("mongoose");

const User = require("../models/User");
const Product = require("../models/Product");

// ==========================================
// ADMIN DASHBOARD
// ==========================================

const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalProducts,
      activeUsers,
      blockedUsers,
    ] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      User.countDocuments({
        status: { $ne: "Blocked" },
        isBlocked: { $ne: true },
      }),
      User.countDocuments({
        $or: [
          { status: "Blocked" },
          { isBlocked: true },
        ],
      }),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalProducts,
        activeUsers,
        blockedUsers,
      },
    });
  } catch (error) {
    console.error("Admin Dashboard Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to load dashboard statistics",
    });
  }
};

// ==========================================
// GET ALL USERS
// ==========================================

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select(
        "-password -resetPasswordToken -resetPasswordExpires -resetPasswordAttempts -resetPasswordRequestedAt"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get Users Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

// ==========================================
// BLOCK OR UNBLOCK USER
// ==========================================

const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    if (!["Active", "Blocked"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be Active or Blocked",
      });
    }

    if (String(req.user.id) === String(id)) {
      return res.status(400).json({
        success: false,
        message: "You cannot block your own account",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent blocking other administrators
    if (user.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Administrator accounts cannot be blocked",
      });
    }

    user.status = status;
    user.isBlocked = status === "Blocked";

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        status === "Blocked"
          ? "User blocked successfully"
          : "User unblocked successfully",
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status,
        isBlocked: user.isBlocked,
      },
    });
  } catch (error) {
    console.error("Update User Status Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to update user status",
    });
  }
};

// ==========================================
// GET ALL PRODUCTS
// ==========================================

const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Get Products Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};

// ==========================================
// DELETE PRODUCT
// ==========================================

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await Product.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete Product Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to delete product",
    });
  }
};

// ==========================================
// EXPORT CONTROLLERS
// ==========================================

module.exports = {
  getDashboardStats,
  getAllUsers,
  updateUserStatus,
  getAllProducts,
  deleteProduct,
};
