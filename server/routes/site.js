const express = require("express");
const router = express.Router();
const SiteStatus = require("../models/SiteStatus");
const auth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");

// GET /api/site/status - Get current site status
router.get("/status", async (req, res) => {
  try {
    const siteStatus = await SiteStatus.getSiteStatus();

    res.json({
      success: true,
      data: {
        isTemporarilyClosed: siteStatus.isTemporarilyClosed,
        lastUpdated: siteStatus.lastUpdated,
        reason: siteStatus.reason,
      },
    });
  } catch (error) {
    console.error("Error getting site status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get site status",
      data: {
        isTemporarilyClosed: false, // Default to open if error
        lastUpdated: new Date(),
        reason: "",
      },
    });
  }
});

// PATCH /api/site/status - Update site status (Admin only)
router.patch("/status", [auth, adminAuth], async (req, res) => {
  try {
    const { isTemporarilyClosed, reason = "" } = req.body;

    if (typeof isTemporarilyClosed !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isTemporarilyClosed must be a boolean",
      });
    }

    const updatedStatus = await SiteStatus.updateSiteStatus(
      isTemporarilyClosed,
      req.user.id,
      reason
    );

    console.log(
      `Site status updated by ${req.user.name}: ${
        isTemporarilyClosed ? "CLOSED" : "OPEN"
      }`
    );

    res.json({
      success: true,
      message: `Site has been ${
        isTemporarilyClosed ? "temporarily closed" : "reopened"
      }`,
      data: {
        isTemporarilyClosed: updatedStatus.isTemporarilyClosed,
        lastUpdated: updatedStatus.lastUpdated,
        reason: updatedStatus.reason,
      },
    });
  } catch (error) {
    console.error("Error updating site status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update site status",
    });
  }
});

// GET /api/site/status/history - Get site status history (Admin only)
router.get("/status/history", [auth, adminAuth], async (req, res) => {
  try {
    const statusHistory = await SiteStatus.find()
      .populate("updatedBy", "name email")
      .sort({ lastUpdated: -1 })
      .limit(50);

    res.json({
      success: true,
      data: statusHistory,
    });
  } catch (error) {
    console.error("Error getting site status history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get site status history",
    });
  }
});

module.exports = router;
