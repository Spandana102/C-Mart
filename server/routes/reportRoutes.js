const express = require("express");
const router = express.Router();

const Report = require("../models/Report");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// ==========================================
// GET ALL REPORTS - ADMIN
// ==========================================
router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const reports = await Report.find()
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        count: reports.length,
        reports,
      });
    } catch (error) {
      console.error("Get Reports Error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to fetch reports",
      });
    }
  }
);

// ==========================================
// UPDATE REPORT STATUS - ADMIN
// ==========================================
router.put(
  "/:id/status",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { status } = req.body;

      const allowedStatus = [
        "Pending",
        "Reviewed",
        "Resolved",
      ];

      if (!allowedStatus.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid report status",
        });
      }

      const report = await Report.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      );

      if (!report) {
        return res.status(404).json({
          success: false,
          message: "Report not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Report status updated successfully",
        report,
      });
    } catch (error) {
      console.error(
        "Update Report Status Error:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Failed to update report status",
      });
    }
  }
);

// ==========================================
// DELETE REPORT - ADMIN
// ==========================================
router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const report = await Report.findByIdAndDelete(
        req.params.id
      );

      if (!report) {
        return res.status(404).json({
          success: false,
          message: "Report not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Report deleted successfully",
      });
    } catch (error) {
      console.error("Delete Report Error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to delete report",
      });
    }
  }
);

module.exports = router;