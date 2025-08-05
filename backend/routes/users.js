// routes/users.js
const express = require("express");
const { body, query, validationResult } = require("express-validator");
const User = require("../models/User");
const Sale = require("../models/Sale");
const auth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private (Admin)
router.get("/", [auth, adminAuth], async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      role = "",
      sortBy = "createdAt",
      sortOrder = "desc",
      isActive = "",
    } = req.query;

    // Build query
    let query = {};

    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by role
    if (role) {
      query.role = role;
    }

    // Filter by active status
    if (isActive !== "") {
      query.isActive = isActive === "true";
    }

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password")
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   GET /api/users/customers
// @desc    Get all customers with purchase stats
// @access  Private (Admin)
router.get("/customers", [auth, adminAuth], async (req, res) => {
  try {
    const customers = await User.find({ role: "customer" })
      .select("-password")
      .sort({ totalSpent: -1 })
      .lean();

    // Get additional stats for each customer
    const customersWithStats = await Promise.all(
      customers.map(async (customer) => {
        const recentPurchases = await Sale.find({
          customer: customer._id,
          status: { $ne: "cancelled" },
        })
          .sort({ createdAt: -1 })
          .limit(3)
          .select("saleId totalAmount createdAt")
          .lean();

        return {
          ...customer,
          recentPurchases,
        };
      })
    );

    res.json({
      success: true,
      data: customersWithStats,
    });
  } catch (error) {
    console.error("Get customers error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get single user
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    // Users can only view their own profile, admins can view any
    if (req.user.role !== "admin" && req.user.id !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // For customers, include recent purchase history
    let userData = user.toObject();

    if (user.role === "customer") {
      const recentPurchases = await Sale.find({
        customer: user._id,
        status: { $ne: "cancelled" },
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("items.snack", "name image")
        .select("saleId totalAmount createdAt items status")
        .lean();

      userData.recentPurchases = recentPurchases;
    }

    res.json({
      success: true,
      data: userData,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user (admin only)
// @access  Private (Admin)
router.put(
  "/:id",
  [auth, adminAuth],
  [
    body("name")
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage("Name must be at least 2 characters"),
    body("email")
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide valid email"),
    body("role")
      .optional()
      .isIn(["admin", "customer"])
      .withMessage("Invalid role"),
    body("isActive")
      .optional()
      .isBoolean()
      .withMessage("isActive must be boolean"),
    body("hostelRoom").optional().trim(),
    body("phoneNumber").optional().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Check if email is being changed and if it already exists
      if (req.body.email && req.body.email !== user.email) {
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: "Email already exists",
          });
        }
      }

      // Update allowed fields
      const allowedUpdates = [
        "name",
        "email",
        "role",
        "isActive",
        "hostelRoom",
        "phoneNumber",
      ];
      allowedUpdates.forEach((field) => {
        if (req.body[field] !== undefined) {
          user[field] = req.body[field];
        }
      });

      await user.save();

      res.json({
        success: true,
        message: "User updated successfully",
        data: user.getPublicProfile(),
      });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

// @route   DELETE /api/users/:id
// @desc    Deactivate user (soft delete)
// @access  Private (Admin)
router.delete("/:id", [auth, adminAuth], async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent admin from deactivating themselves
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "Cannot deactivate your own account",
      });
    }

    // Soft delete - deactivate user
    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: "User deactivated successfully",
    });
  } catch (error) {
    console.error("Deactivate user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   POST /api/users/:id/activate
// @desc    Activate user
// @access  Private (Admin)
router.post("/:id/activate", [auth, adminAuth], async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.isActive = true;
    await user.save();

    res.json({
      success: true,
      message: "User activated successfully",
      data: user.getPublicProfile(),
    });
  } catch (error) {
    console.error("Activate user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   GET /api/users/:id/purchase-history
// @desc    Get user's purchase history
// @access  Private
router.get("/:id/purchase-history", auth, async (req, res) => {
  try {
    // Users can only view their own history, admins can view any
    if (req.user.role !== "admin" && req.user.id !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const {
      page = 1,
      limit = 10,
      startDate = "",
      endDate = "",
      status = "",
    } = req.query;

    // Build query
    let query = { customer: req.params.id };

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [purchases, total] = await Promise.all([
      Sale.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("items.snack", "name image category")
        .lean(),
      Sale.countDocuments(query),
    ]);

    // Calculate summary stats
    const stats = await Sale.aggregate([
      {
        $match: {
          customer: mongoose.Types.ObjectId(req.params.id),
          status: { $ne: "cancelled" },
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: "$totalAmount" },
          totalItems: { $sum: "$totalItems" },
          averageOrderValue: { $avg: "$totalAmount" },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        purchases,
        stats: stats[0] || {
          totalOrders: 0,
          totalSpent: 0,
          totalItems: 0,
          averageOrderValue: 0,
        },
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Get purchase history error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   GET /api/users/:id/favorite-snacks
// @desc    Get user's favorite snacks based on purchase history
// @access  Private
router.get("/:id/favorite-snacks", auth, async (req, res) => {
  try {
    // Users can only view their own favorites, admins can view any
    if (req.user.role !== "admin" && req.user.id !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const favoriteSnacks = await Sale.aggregate([
      {
        $match: {
          customer: mongoose.Types.ObjectId(req.params.id),
          status: { $ne: "cancelled" },
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.snack",
          snackName: { $first: "$items.snackName" },
          snackImage: { $first: "$items.snackImage" },
          totalQuantity: { $sum: "$items.quantity" },
          totalSpent: { $sum: "$items.totalPrice" },
          purchaseCount: { $sum: 1 },
          averagePrice: { $avg: "$items.unitPrice" },
          lastPurchased: { $max: "$createdAt" },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      success: true,
      data: favoriteSnacks,
    });
  } catch (error) {
    console.error("Get favorite snacks error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   POST /api/users/bulk-action
// @desc    Perform bulk actions on users (admin only)
// @access  Private (Admin)
router.post(
  "/bulk-action",
  [auth, adminAuth],
  [
    body("action")
      .isIn(["activate", "deactivate", "delete"])
      .withMessage("Invalid action"),
    body("userIds")
      .isArray({ min: 1 })
      .withMessage("User IDs array is required"),
    body("userIds.*").isMongoId().withMessage("Invalid user ID"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { action, userIds } = req.body;

      // Prevent admin from performing actions on themselves
      if (userIds.includes(req.user.id)) {
        return res.status(400).json({
          success: false,
          message: "Cannot perform bulk actions on your own account",
        });
      }

      let updateQuery = {};
      let message = "";

      switch (action) {
        case "activate":
          updateQuery = { isActive: true };
          message = "Users activated successfully";
          break;
        case "deactivate":
          updateQuery = { isActive: false };
          message = "Users deactivated successfully";
          break;
        case "delete":
          // For this example, we'll just deactivate instead of hard delete
          updateQuery = { isActive: false };
          message = "Users deactivated successfully";
          break;
      }

      const result = await User.updateMany(
        { _id: { $in: userIds } },
        updateQuery
      );

      res.json({
        success: true,
        message: message,
        data: {
          modifiedCount: result.modifiedCount,
          matchedCount: result.matchedCount,
        },
      });
    } catch (error) {
      console.error("Bulk action error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

module.exports = router;
