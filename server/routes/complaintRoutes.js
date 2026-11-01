
const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

// =====================================
// IMPORT MODELS
// =====================================

// IMPORTANT: Filename is Complaints.js
const Complaint = require("../models/Complaints");
const User = require("../models/User");

// =====================================
// IMPORT MIDDLEWARE
// =====================================

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// =====================================
// HELPER - GET LOGGED-IN USER
// =====================================

const getLoggedInUser = async (req) => {
  const userId = req.user?.id || req.user?._id;

  if (!userId || !mongoose.isValidObjectId(userId)) {
    return null;
  }

  return User.findById(userId).select(
    "_id fullName email status isBlocked role"
  );
};

// =====================================
// HELPER - CHECK BLOCKED ACCOUNT
// =====================================

const isBlocked = (user) => {
  return (
    user?.isBlocked === true ||
    String(user?.status || "").toLowerCase() === "blocked"
  );
};

// =====================================
// HELPER - VALIDATE COMPLAINT ID
// =====================================

const validateComplaintId = (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid complaint ID",
    });
  }

  next();
};

// =====================================
// CREATE COMPLAINT
// POST /api/complaints
// =====================================

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { subject, description } = req.body || {};

    if (
      typeof subject !== "string" ||
      typeof description !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Subject and description are required",
      });
    }

    const cleanSubject = subject.trim();
    const cleanDescription = description.trim();

    if (!cleanSubject || !cleanDescription) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all complaint details",
      });
    }

    if (cleanSubject.length > 150) {
      return res.status(400).json({
        success: false,
        message: "Subject cannot exceed 150 characters",
      });
    }

    if (cleanDescription.length > 3000) {
      return res.status(400).json({
        success: false,
        message: "Description cannot exceed 3000 characters",
      });
    }

    const user = await getLoggedInUser(req);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found. Please login again.",
      });
    }

    if (isBlocked(user)) {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked.",
      });
    }

    if (!user.fullName || !user.email) {
      return res.status(400).json({
        success: false,
        message: "Please complete your profile first.",
      });
    }

    const complaint = await Complaint.create({
      userName: user.fullName,
      userEmail: user.email,
      subject: cleanSubject,
      description: cleanDescription,
      status: "Pending",
    });

    return res.status(201).json({
      success: true,
      message: "Complaint submitted successfully",
      complaint,
    });
  } catch (error) {
    console.error("Create Complaint Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit complaint",
    });
  }
});

// =====================================
// GET MY COMPLAINTS
// GET /api/complaints/my
// =====================================

router.get("/my", authMiddleware, async (req, res) => {
  try {
    const user = await getLoggedInUser(req);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found. Please login again.",
      });
    }

    if (isBlocked(user)) {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked.",
      });
    }

    const complaints = await Complaint.find({
      userEmail: user.email,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: complaints.length,
      complaints,
    });
  } catch (error) {
    console.error("Get My Complaints Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch your complaints",
    });
  }
});

// =====================================
// GET ALL COMPLAINTS - ADMIN
// GET /api/complaints
// =====================================

router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const complaints = await Complaint.find()
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        count: complaints.length,
        complaints,
      });
    } catch (error) {
      console.error("Get All Complaints Error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch complaints",
      });
    }
  }
);

// =====================================
// GET SINGLE COMPLAINT
// GET /api/complaints/:id
// =====================================

router.get(
  "/:id",
  authMiddleware,
  validateComplaintId,
  async (req, res) => {
    try {
      const user = await getLoggedInUser(req);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found. Please login again.",
        });
      }

      if (isBlocked(user)) {
        return res.status(403).json({
          success: false,
          message: "Your account has been blocked.",
        });
      }

      const complaint = await Complaint.findById(
        req.params.id
      );

      if (!complaint) {
        return res.status(404).json({
          success: false,
          message: "Complaint not found",
        });
      }

      const isAdmin = user.role === "admin";

      const isOwner =
        String(complaint.userEmail || "").toLowerCase() ===
        String(user.email || "").toLowerCase();

      if (!isAdmin && !isOwner) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      return res.status(200).json({
        success: true,
        complaint,
      });
    } catch (error) {
      console.error("Get Complaint Error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch complaint",
      });
    }
  }
);

// =====================================
// UPDATE COMPLAINT STATUS - ADMIN
// PUT /api/complaints/:id/status
// =====================================

router.put(
  "/:id/status",
  authMiddleware,
  adminMiddleware,
  validateComplaintId,
  async (req, res) => {
    try {
      const { status } = req.body || {};

      const allowedStatuses = [
        "Pending",
        "In Progress",
        "Resolved",
      ];

      if (
        typeof status !== "string" ||
        !allowedStatuses.includes(status)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid complaint status",
        });
      }

      const complaint =
        await Complaint.findByIdAndUpdate(
          req.params.id,
          { status },
          {
            new: true,
            runValidators: true,
          }
        );

      if (!complaint) {
        return res.status(404).json({
          success: false,
          message: "Complaint not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Complaint status updated successfully",
        complaint,
      });
    } catch (error) {
      console.error("Update Complaint Error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to update complaint status",
      });
    }
  }
);

// =====================================
// DELETE COMPLAINT - ADMIN
// DELETE /api/complaints/:id
// =====================================

router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  validateComplaintId,
  async (req, res) => {
    try {
      const complaint =
        await Complaint.findByIdAndDelete(
          req.params.id
        );

      if (!complaint) {
        return res.status(404).json({
          success: false,
          message: "Complaint not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Complaint deleted successfully",
        deletedComplaintId: req.params.id,
      });
    } catch (error) {
      console.error("Delete Complaint Error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to delete complaint",
      });
    }
  }
);

// =====================================
// EXPORT ROUTER
// =====================================

module.exports = router;
