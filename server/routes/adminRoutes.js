const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const User = require("../models/User");

// ==========================================
// ADMIN DASHBOARD
// ==========================================
router.get(
    "/dashboard",
    authMiddleware,
    adminMiddleware,
    async (req, res) => {
        try {
            const totalUsers = await User.countDocuments();

            const activeUsers = await User.countDocuments({
                status: "Active"
            });

            const blockedUsers = await User.countDocuments({
                status: "Blocked"
            });

            res.status(200).json({
                success: true,
                message: "Welcome to Admin Dashboard",
                stats: {
                    totalUsers,
                    activeUsers,
                    blockedUsers
                }
            });

        } catch (error) {
            console.error("Dashboard Error:", error);

            res.status(500).json({
                success: false,
                message: "Failed to load dashboard"
            });
        }
    }
);


// ==========================================
// GET ALL USERS
// ==========================================
router.get(
    "/users",
    authMiddleware,
    adminMiddleware,
    async (req, res) => {
        try {
            const users = await User.find()
                .select("-password")
                .sort({ createdAt: -1 });

            res.status(200).json({
                success: true,
                count: users.length,
                users
            });

        } catch (error) {
            console.error("Get Users Error:", error);

            res.status(500).json({
                success: false,
                message: "Failed to fetch users"
            });
        }
    }
);


// ==========================================
// GET SINGLE USER
// ==========================================
router.get(
    "/users/:id",
    authMiddleware,
    adminMiddleware,
    async (req, res) => {
        try {
            const user = await User.findById(req.params.id)
                .select("-password");

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            res.status(200).json({
                success: true,
                user
            });

        } catch (error) {
            console.error("Get User Error:", error);

            res.status(500).json({
                success: false,
                message: "Failed to fetch user"
            });
        }
    }
);


// ==========================================
// BLOCK / UNBLOCK USER
// ==========================================
router.put(
    "/users/:id/status",
    authMiddleware,
    adminMiddleware,
    async (req, res) => {
        try {
            const user = await User.findById(req.params.id);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            // Admin cannot block their own account
            if (user._id.toString() === req.user.id.toString()) {
                return res.status(400).json({
                    success: false,
                    message: "You cannot block your own admin account"
                });
            }

            user.status =
                user.status === "Blocked"
                    ? "Active"
                    : "Blocked";

            await user.save();

            res.status(200).json({
                success: true,
                message: `User ${user.status.toLowerCase()} successfully`,
                user: {
                    id: user._id,
                    fullName: user.fullName,
                    status: user.status
                }
            });

        } catch (error) {
            console.error("Update User Status Error:", error);

            res.status(500).json({
                success: false,
                message: "Failed to update user status"
            });
        }
    }
);


// ==========================================
// DELETE USER
// ==========================================
router.delete(
    "/users/:id",
    authMiddleware,
    adminMiddleware,
    async (req, res) => {
        try {
            const user = await User.findById(req.params.id);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            // Admin cannot delete their own account
            if (user._id.toString() === req.user.id.toString()) {
                return res.status(400).json({
                    success: false,
                    message: "You cannot delete your own admin account"
                });
            }

            await User.findByIdAndDelete(req.params.id);

            res.status(200).json({
                success: true,
                message: "User deleted successfully"
            });

        } catch (error) {
            console.error("Delete User Error:", error);

            res.status(500).json({
                success: false,
                message: "Failed to delete user"
            });
        }
    }
);


module.exports = router;