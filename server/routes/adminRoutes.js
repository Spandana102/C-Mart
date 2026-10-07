const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");
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
                    blockedUsers,
                    reports: 0,
                    complaints: 0
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
            const user = await User.findById(
                req.params.id
            ).select("-password");

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
// ADD NEW USER
// ==========================================
router.post(
    "/users",
    authMiddleware,
    adminMiddleware,
    async (req, res) => {
        try {
            const {
                fullName,
                email,
                password,
                collegeId,
                phoneNumber,
                role
            } = req.body;

            // ------------------------------------------
            // CHECK REQUIRED FIELDS
            // ------------------------------------------
            if (
                !fullName ||
                !email ||
                !password ||
                !collegeId ||
                !phoneNumber
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Full name, email, password, college ID and phone number are required"
                });
            }

            // ------------------------------------------
            // CLEAN INPUT
            // ------------------------------------------
            const cleanName = fullName.trim();
            const cleanEmail = email.toLowerCase().trim();
            const cleanCollegeId = collegeId.trim();
            const cleanPhoneNumber = phoneNumber.trim();

            // ------------------------------------------
            // CHECK EMPTY VALUES
            // ------------------------------------------
            if (
                !cleanName ||
                !cleanEmail ||
                !password.trim() ||
                !cleanCollegeId ||
                !cleanPhoneNumber
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "All required fields must contain valid values"
                });
            }

            // ------------------------------------------
            // CHECK EMAIL ALREADY EXISTS
            // ------------------------------------------
            const existingEmail = await User.findOne({
                email: cleanEmail
            });

            if (existingEmail) {
                return res.status(400).json({
                    success: false,
                    message:
                        "User with this email already exists"
                });
            }

            // ------------------------------------------
            // CHECK COLLEGE ID ALREADY EXISTS
            // ------------------------------------------
            const existingCollegeId =
                await User.findOne({
                    collegeId: cleanCollegeId
                });

            if (existingCollegeId) {
                return res.status(400).json({
                    success: false,
                    message:
                        "User with this college ID already exists"
                });
            }

            // ------------------------------------------
            // HASH PASSWORD
            // ------------------------------------------
            const hashedPassword =
                await bcrypt.hash(password, 10);

            // ------------------------------------------
            // CREATE USER
            // ------------------------------------------
            const newUser = new User({
                fullName: cleanName,
                email: cleanEmail,
                password: hashedPassword,
                collegeId: cleanCollegeId,
                phoneNumber: cleanPhoneNumber,
                role: role === "admin"
                    ? "admin"
                    : "user",
                status: "Active"
            });

            await newUser.save();

            // ------------------------------------------
            // REMOVE PASSWORD FROM RESPONSE
            // ------------------------------------------
            const userResponse =
                newUser.toObject();

            delete userResponse.password;

            // ------------------------------------------
            // SUCCESS RESPONSE
            // ------------------------------------------
            res.status(201).json({
                success: true,
                message: "User added successfully",
                user: userResponse
            });

        } catch (error) {
            console.error(
                "Add User Error:",
                error
            );

            // Handle MongoDB duplicate key errors
            if (error.code === 11000) {
                const duplicateField =
                    Object.keys(
                        error.keyPattern || {}
                    )[0];

                let message =
                    "A user with this information already exists.";

                if (duplicateField === "email") {
                    message =
                        "User with this email already exists.";
                }

                if (duplicateField === "collegeId") {
                    message =
                        "User with this college ID already exists.";
                }

                return res.status(400).json({
                    success: false,
                    message
                });
            }

            res.status(500).json({
                success: false,
                message: "Failed to add user",
                error: error.message
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
            const user = await User.findById(
                req.params.id
            );

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            // Admin cannot block their own account
            if (
                user._id.toString() ===
                req.user.id.toString()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "You cannot block your own admin account"
                });
            }

            user.status =
                user.status === "Blocked"
                    ? "Active"
                    : "Blocked";

            await user.save();

            res.status(200).json({
                success: true,
                message:
                    `User ${user.status.toLowerCase()} successfully`,
                user: {
                    id: user._id,
                    fullName: user.fullName,
                    status: user.status
                }
            });

        } catch (error) {
            console.error(
                "Update User Status Error:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Failed to update user status"
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
            const user = await User.findById(
                req.params.id
            );

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            // Admin cannot delete their own account
            if (
                user._id.toString() ===
                req.user.id.toString()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "You cannot delete your own admin account"
                });
            }

            await User.findByIdAndDelete(
                req.params.id
            );

            res.status(200).json({
                success: true,
                message:
                    "User deleted successfully"
            });

        } catch (error) {
            console.error(
                "Delete User Error:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Failed to delete user"
            });
        }
    }
);


module.exports = router;