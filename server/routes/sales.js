// routes/sales.js
const express = require("express");
const { body, query, validationResult } = require("express-validator");
const mongoose = require("mongoose");
const Sale = require("../models/Sale");
const Snack = require("../models/Snack");
const User = require("../models/User");
const auth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();

// @route   GET /api/sales
// @desc    Get sales with filtering and pagination
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
      status = "",
      paymentStatus = "",
      customer = "",
      startDate = "",
      endDate = "",
      minAmount = "",
      maxAmount = "",
    } = req.query;

    // Build query
    let query = {};

    // For customers, only show their own sales
    if (req.user.role === "customer") {
      query.customer = req.user.id;
    }

    // Filter by customer (admin only)
    if (customer && req.user.role === "admin") {
      query.customer = customer;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by payment status
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      query.totalAmount = {};
      if (minAmount) query.totalAmount.$gte = parseFloat(minAmount);
      if (maxAmount) query.totalAmount.$lte = parseFloat(maxAmount);
    }

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [sales, total] = await Promise.all([
      Sale.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit))
        .populate("customer", "name email avatar")
        .populate("items.snack", "name image category")
        .lean(),
      Sale.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: sales,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Get sales error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   GET /api/sales/stats
// @desc    Get sales statistics
// @access  Private (Admin)
router.get("/stats", [auth, adminAuth], async (req, res) => {
  try {
    const { startDate, endDate, period = "month" } = req.query;

    // Get overall stats
    const overallStats = await Sale.getSalesStats(startDate, endDate);

    // Get daily sales for the last 30 days
    const dailySales = await Sale.getDailySales(30);

    // Get top customers
    const topCustomers = await Sale.getTopCustomers(10);

    // Get product performance
    const productPerformance = await Sale.getProductPerformance();

    // Get monthly revenue for current year
    const currentYear = new Date().getFullYear();
    const monthlyRevenue = await Sale.getMonthlyRevenue(currentYear);

    // Get recent sales
    const recentSales = await Sale.find({ status: { $ne: "cancelled" } })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("customer", "name")
      .select("saleId customerName totalAmount createdAt status");

    res.json({
      success: true,
      data: {
        overall: overallStats,
        daily: dailySales,
        monthly: monthlyRevenue,
        topCustomers,
        productPerformance: productPerformance.slice(0, 10),
        recent: recentSales,
      },
    });
  } catch (error) {
    console.error("Get sales stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   GET /api/sales/:id
// @desc    Get single sale
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    let query = { _id: req.params.id };

    // Customers can only see their own sales
    if (req.user.role === "customer") {
      query.customer = req.user.id;
    }

    const sale = await Sale.findOne(query)
      .populate("customer", "name email avatar hostelRoom phoneNumber")
      .populate("items.snack", "name image category description")
      .populate("createdBy", "name");

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Sale not found",
      });
    }

    res.json({
      success: true,
      data: sale,
    });
  } catch (error) {
    console.error("Get sale error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   POST /api/sales
// @desc    Create new sale (checkout)
// @access  Private
router.post(
  "/",
  auth,
  [
    body("items")
      .isArray({ min: 1 })
      .withMessage("Items array is required and must not be empty"),
    body("items.*.snack").isMongoId().withMessage("Valid snack ID is required"),
    body("items.*.quantity")
      .isInt({ min: 1 })
      .withMessage("Quantity must be at least 1"),
    body("paymentMethod")
      .optional()
      .isIn(["cash", "upi", "card", "credit"])
      .withMessage("Invalid payment method"),
    body("notes")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Notes must be less than 500 characters"),
    body("location.room").optional().trim(),
    body("location.hostel").optional().trim(),
    body("discount.percentage")
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage("Discount percentage must be between 0 and 100"),
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

      const {
        items,
        paymentMethod = "cash",
        notes = "",
        location = {},
        discount = {},
      } = req.body;

      // Validate stock availability and prepare sale items
      const saleItems = [];
      const snackUpdates = [];

      for (const item of items) {
        const snack = await Snack.findById(item.snack);

        if (!snack || !snack.isActive) {
          return res.status(400).json({
            success: false,
            message: `Snack with ID ${item.snack} not found`,
          });
        }

        if (snack.quantity < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${snack.name}. Available: ${snack.quantity}, Requested: ${item.quantity}`,
          });
        }

        // Prepare sale item
        saleItems.push({
          snack: snack._id,
          snackName: snack.name,
          snackImage: snack.image,
          quantity: item.quantity,
          unitPrice: snack.price,
          totalPrice: snack.price * item.quantity,
          costPrice: snack.costPrice || 0,
        });

        // Prepare stock update
        snackUpdates.push({
          snack,
          quantitySold: item.quantity,
          saleAmount: snack.price * item.quantity,
        });
      }

      // Create sale
      const sale = new Sale({
        customer: req.user.id,
        customerName: req.user.name,
        items: saleItems,
        paymentMethod,
        notes,
        location,
        discount,
        createdBy: req.user.role === "admin" ? req.user.id : undefined,
      });

      await sale.save();

      // Update stock and sales data
      await Promise.all(
        snackUpdates.map(({ snack, quantitySold, saleAmount }) =>
          snack.updateStock(quantitySold, saleAmount)
        )
      );

      // Update customer statistics
      const customer = await User.findById(req.user.id);
      customer.totalPurchases += 1;
      customer.totalSpent += sale.totalAmount;
      await customer.save();

      // Populate the sale for response
      await sale.populate([
        { path: "customer", select: "name email" },
        { path: "items.snack", select: "name image category" },
      ]);

      res.status(201).json({
        success: true,
        message: "Purchase completed successfully",
        data: sale,
      });
    } catch (error) {
      console.error("Create sale error:", error);
      res.status(500).json({
        success: false,
        message: "Server error during checkout",
      });
    }
  }
);

// @route   PUT /api/sales/:id/status
// @desc    Update sale status
// @access  Private (Admin)
router.put(
  "/:id/status",
  [auth, adminAuth],
  [
    body("status")
      .isIn(["pending", "confirmed", "delivered", "cancelled"])
      .withMessage("Invalid status"),
    body("reason")
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage("Reason must be less than 200 characters"),
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

      const { status, reason } = req.body;
      const sale = await Sale.findById(req.params.id);

      if (!sale) {
        return res.status(404).json({
          success: false,
          message: "Sale not found",
        });
      }

      const oldStatus = sale.status;

      if (status === "cancelled" && oldStatus !== "cancelled") {
        // Restore stock when cancelling
        for (const item of sale.items) {
          await Snack.findByIdAndUpdate(item.snack, {
            $inc: {
              quantity: item.quantity,
              sales: -item.quantity,
              revenue: -item.totalPrice,
            },
          });
        }

        // Update customer statistics
        const customer = await User.findById(sale.customer);
        customer.totalPurchases = Math.max(0, customer.totalPurchases - 1);
        customer.totalSpent = Math.max(
          0,
          customer.totalSpent - sale.totalAmount
        );
        await customer.save();

        await sale.cancel(reason || "Cancelled by admin");
      } else if (status === "delivered") {
        await sale.markCompleted();
      } else {
        sale.status = status;
        if (reason) {
          sale.notes = sale.notes ? `${sale.notes} | ${reason}` : reason;
        }
        await sale.save();
      }

      res.json({
        success: true,
        message: `Sale status updated to ${status}`,
        data: sale,
      });
    } catch (error) {
      console.error("Update sale status error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

// @route   POST /api/sales/:id/refund
// @desc    Process refund
// @access  Private (Admin)
router.post(
  "/:id/refund",
  [auth, adminAuth],
  [
    body("amount")
      .isFloat({ min: 0 })
      .withMessage("Refund amount must be a positive number"),
    body("reason")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Refund reason is required"),
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

      const { amount, reason } = req.body;
      const sale = await Sale.findById(req.params.id);

      if (!sale) {
        return res.status(404).json({
          success: false,
          message: "Sale not found",
        });
      }

      if (amount > sale.totalAmount) {
        return res.status(400).json({
          success: false,
          message: "Refund amount cannot exceed sale total",
        });
      }

      await sale.processRefund(amount, reason);

      // Update customer statistics
      const customer = await User.findById(sale.customer);
      customer.totalSpent = Math.max(0, customer.totalSpent - amount);
      await customer.save();

      res.json({
        success: true,
        message: "Refund processed successfully",
        data: sale,
      });
    } catch (error) {
      console.error("Process refund error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

// @route   GET /api/sales/customer/:customerId
// @desc    Get sales for specific customer
// @access  Private (Admin)
router.get("/customer/:customerId", [auth, adminAuth], async (req, res) => {
  try {
    const { customerId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [sales, total] = await Promise.all([
      Sale.find({ customer: customerId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("items.snack", "name image")
        .lean(),
      Sale.countDocuments({ customer: customerId }),
    ]);

    // Get customer stats
    const customerStats = await Sale.aggregate([
      {
        $match: {
          customer: mongoose.Types.ObjectId(customerId),
          status: { $ne: "cancelled" },
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: "$totalAmount" },
          averageOrderValue: { $avg: "$totalAmount" },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        sales,
        stats: customerStats[0] || {
          totalOrders: 0,
          totalSpent: 0,
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
    console.error("Get customer sales error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   DELETE /api/sales/:id
// @desc    Delete sale (hard delete - use with caution)
// @access  Private (Admin)
router.delete("/:id", [auth, adminAuth], async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Sale not found",
      });
    }

    // Only allow deletion of cancelled sales
    if (sale.status !== "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Only cancelled sales can be deleted",
      });
    }

    await Sale.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Sale deleted successfully",
    });
  } catch (error) {
    console.error("Delete sale error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = router;
