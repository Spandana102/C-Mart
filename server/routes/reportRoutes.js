
const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const Report = require("../models/Report");
const User = require("../models/User");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// ==========================================
// HELPERS
// ==========================================

const validateReportId = (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid report ID",
    });
  }

  next();
};

const getCurrentUser = async (req) => {
  const userId = req.user?.id || req.user?._id;

  if (!userId || !mongoose.isValidObjectId(userId)) {
    return null;
  }

  return User.findById(userId).select(
    "fullName email role status isBlocked"
  );
};

const isBlocked = (user) =>
  user?.isBlocked === true ||
  String(user?.status || "").toLowerCase() === "blocked";

const allowedStatuses = [
  "Pending",
  "In Progress",
  "Reviewed",
  "Resolved",
  "Rejected",
];

// ==========================================
// SUBMIT REPORT - STUDENT
// POST /api/reports
// ==========================================

router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      reportedUser,
      reportedProduct,
      reason,
      description,
    } = req.body || {};

    if (
      typeof reason !== "string" ||
      !reason.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Report reason is required",
      });
    }

    if (
      reason.trim().length > 200 ||
      (
        description !== undefined &&
        (
          typeof description !== "string" ||
          description.length > 3000
        )
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid report details",
      });
    }

    if (
      (
        reportedUser !== undefined &&
        typeof reportedUser !== "string"
      ) ||
      (
        reportedProduct !== undefined &&
        typeof reportedProduct !== "string"
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid reported user or product",
      });
    }

    const cleanReportedUser =
      (reportedUser || "").trim();

    const cleanReportedProduct =
      (reportedProduct || "").trim();

    if (
      !cleanReportedUser &&
      !cleanReportedProduct
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please select a user or product to report",
      });
    }

    const user = await getCurrentUser(req);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Please login again",
      });
    }

    if (isBlocked(user)) {
      return res.status(403).json({
        success: false,
        message: "Your account is blocked",
      });
    }

    const report = await Report.create({
      reporterName: user.fullName,
      reporterEmail: user.email,
      reportedUser: cleanReportedUser,
      reportedProduct: cleanReportedProduct,
      reason: reason.trim(),
      description:
        typeof description === "string"
          ? description.trim()
          : "",
      status: "Pending",
    });

    return res.status(201).json({
      success: true,
      message: "Report submitted successfully",
      report,
    });
  } catch (error) {
    console.error(
      "Submit Report Error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to submit report",
    });
  }
});

// ==========================================
// GET MY REPORTS - STUDENT
// GET /api/reports/my
// ==========================================

router.get("/my", authMiddleware, async (req, res) => {
  try {
    const user = await getCurrentUser(req);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Please login again",
      });
    }

    if (isBlocked(user)) {
      return res.status(403).json({
        success: false,
        message: "Your account is blocked",
      });
    }

    const reports = await Report.find({
      reporterEmail: user.email,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: reports.length,
      reports,
    });
  } catch (error) {
    console.error(
      "Get My Reports Error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch your reports",
    });
  }
});

// ==========================================
// GET ALL REPORTS - ADMIN
// GET /api/reports
// ==========================================

router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const reports = await Report.find()
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        count: reports.length,
        reports,
      });
    } catch (error) {
      console.error(
        "Get Reports Error:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message: "Failed to fetch reports",
      });
    }
  }
);

// ==========================================
// GET SINGLE REPORT - OWNER OR ADMIN
// GET /api/reports/:id
// ==========================================

router.get(
  "/:id",
  authMiddleware,
  validateReportId,
  async (req, res) => {
    try {
      const user = await getCurrentUser(req);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Please login again",
        });
      }

      if (isBlocked(user)) {
        return res.status(403).json({
          success: false,
          message: "Your account is blocked",
        });
      }

      const report = await Report.findById(
        req.params.id
      );

      if (!report) {
        return res.status(404).json({
          success: false,
          message: "Report not found",
        });
      }

      const isAdmin = user.role === "admin";

      const isOwner =
        String(report.reporterEmail || "")
          .trim()
          .toLowerCase() ===
        String(user.email || "")
          .trim()
          .toLowerCase();

      if (!isAdmin && !isOwner) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      return res.status(200).json({
        success: true,
        report,
      });
    } catch (error) {
      console.error(
        "Get Report Error:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message: "Failed to fetch report",
      });
    }
  }
);

// ==========================================
// UPDATE REPORT STATUS - ADMIN
// PUT /api/reports/:id/status
// ==========================================

router.put(
  "/:id/status",
  authMiddleware,
  adminMiddleware,
  validateReportId,
  async (req, res) => {
    try {
      const { status } = req.body || {};

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid report status",
        });
      }

      const report =
        await Report.findByIdAndUpdate(
          req.params.id,
          { $set: { status } },
          {
            new: true,
            runValidators: true,
          }
        );

      if (!report) {
        return res.status(404).json({
          success: false,
          message: "Report not found",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Report status updated successfully",
        report,
      });
    } catch (error) {
      console.error(
        "Update Report Status Error:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message: "Failed to update report status",
      });
    }
  }
);

// ==========================================
// DELETE REPORT - ADMIN
// DELETE /api/reports/:id
// ==========================================

router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  validateReportId,
  async (req, res) => {
    try {
      const report =
        await Report.findByIdAndDelete(
          req.params.id
        );

      if (!report) {
        return res.status(404).json({
          success: false,
          message: "Report not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Report deleted successfully",
        deletedReportId: req.params.id,
      });
    } catch (error) {
      console.error(
        "Delete Report Error:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message: "Failed to delete report",
      });
    }
  }
);

module.exports = router;
