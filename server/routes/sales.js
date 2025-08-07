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
      search = "",
      status = "",
      startDate = "",
      endDate = "",
      sortBy = "createdAt",
      sortOrder = "desc",
      customer = "",
    } = req.query;

    // Build query
    let query = {};

    // For customers, they can only see their own sales
    if (req.user.role === "customer") {
      query.customer = req.user.id;
    }
    // For admins, they can filter by customer if provided
    else if (req.user.role === "admin" && customer) {
      query.customer = customer;
    }

    // Search by sale ID or customer name
    if (search) {
      query.$or = [
        { saleId: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
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
        .populate("customer", "name email")
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
// @access  Private
router.get("/stats", [auth, adminAuth], async (req, res) => {
  try {
    console.log("=== Sales Revenue Stats ===");

    // Test basic connection
    const testCount = await Sale.countDocuments({});
    console.log("Total sales in DB:", testCount);

    if (testCount === 0) {
      return res.json({
        success: true,
        data: {
          overall: {
            totalSales: 0, // Number of sales transactions
            totalRevenue: 0, // Total money earned
            totalProfit: 0, // Total profit
            totalItemsSold: 0, // Total items sold (not inventory)
            todaysSales: 0, // Number of sales today
            todaysRevenue: 0, // Money earned today
            averageOrderValue: 0,
          },
        },
      });
    }

    // Get all active sales (not cancelled)
    console.log("Fetching all active sales for revenue calculation...");
    const allSales = await Sale.find({ status: { $ne: "cancelled" } }).lean();
    console.log("Found active sales:", allSales.length);

    // Calculate REVENUE totals (money earned)
    let totalRevenue = 0;
    let totalItemsSold = 0;

    for (const sale of allSales) {
      // Add to total REVENUE (money earned)
      totalRevenue += sale.totalAmount || 0;

      // Count total items SOLD (for reference, not main metric)
      if (sale.items && Array.isArray(sale.items)) {
        for (const item of sale.items) {
          totalItemsSold += item.quantity || 0;
        }
      }
    }

    // Calculate TODAY'S revenue
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log("Calculating today's revenue between:", { today, tomorrow });

    const todaysSales = await Sale.find({
      createdAt: { $gte: today, $lt: tomorrow },
      status: { $ne: "cancelled" },
    }).lean();

    console.log("Today's sales found:", todaysSales.length);

    let todaysRevenue = 0;
    for (const sale of todaysSales) {
      todaysRevenue += sale.totalAmount || 0; // Sum of money earned today
    }

    // Build final response - REVENUE FOCUSED
    const overallStats = {
      totalSales: allSales.length, // Number of sales transactions
      totalRevenue: totalRevenue, // MAIN METRIC: Total money earned
      totalProfit: totalRevenue, // Since no cost, profit = revenue
      totalItemsSold: totalItemsSold, // Items sold (not inventory count)
      averageOrderValue:
        allSales.length > 0 ? totalRevenue / allSales.length : 0,
      todaysSales: todaysSales.length, // Number of transactions today
      todaysRevenue: todaysRevenue, // MAIN METRIC: Money earned today
    };

    console.log("Revenue-focused stats calculated:", overallStats);

    res.json({
      success: true,
      data: {
        overall: overallStats,
      },
    });
  } catch (error) {
    console.error("Sales stats route error:", error.message);

    res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`,
    });
  }
});

// Add this simple test route to routes/sales.js to verify your data:

// @route   GET /api/sales/test-data
// @desc    Test sales data retrieval
// @access  Private (Admin)
router.get("/test-data", [auth, adminAuth], async (req, res) => {
  try {
    console.log("=== Testing Sales Data ===");

    // Test 1: Count documents
    const totalCount = await Sale.countDocuments({});
    console.log("Total sales count:", totalCount);

    // Test 2: Count active sales
    const activeCount = await Sale.countDocuments({
      status: { $ne: "cancelled" },
    });
    console.log("Active sales count:", activeCount);

    // Test 3: Get first 3 sales with full data
    const sampleSales = await Sale.find({})
      .limit(3)
      .select("saleId status totalAmount items createdAt customerName")
      .lean();

    console.log("Sample sales:", JSON.stringify(sampleSales, null, 2));

    // Test 4: Manual calculation
    let manualTotal = 0;
    let manualItems = 0;

    const allSales = await Sale.find({ status: { $ne: "cancelled" } })
      .select("totalAmount items")
      .lean();

    allSales.forEach((sale) => {
      manualTotal += sale.totalAmount || 0;
      if (sale.items && Array.isArray(sale.items)) {
        manualItems += sale.items.reduce(
          (sum, item) => sum + (item.quantity || 0),
          0
        );
      }
    });

    console.log("Manual calculations:", {
      totalRevenue: manualTotal,
      totalItems: manualItems,
      salesCount: allSales.length,
    });

    // Test 5: Today's sales
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysSales = await Sale.find({
      createdAt: { $gte: today, $lt: tomorrow },
      status: { $ne: "cancelled" },
    })
      .select("totalAmount")
      .lean();

    const todaysRevenue = todaysSales.reduce(
      (sum, sale) => sum + (sale.totalAmount || 0),
      0
    );

    console.log("Today's data:", {
      count: todaysSales.length,
      revenue: todaysRevenue,
      dateRange: { today, tomorrow },
    });

    res.json({
      success: true,
      test_results: {
        totalCount,
        activeCount,
        sampleSales,
        manualCalculations: {
          totalRevenue: manualTotal,
          totalItems: manualItems,
          salesCount: allSales.length,
        },
        todaysStats: {
          count: todaysSales.length,
          revenue: todaysRevenue,
        },
      },
    });
  } catch (error) {
    console.error("Test data error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
      stack: error.stack,
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
router.post("/", auth, async (req, res) => {
  try {
    const {
      items,
      paymentMethod = "cash",
      notes = "",
      location = {},
    } = req.body;

    // Validate basic requirements
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Items are required",
      });
    }

    // Get user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Process items and calculate total
    let totalAmount = 0;
    const processedItems = [];

    for (const item of items) {
      const snack = await Snack.findById(item.snack);
      if (!snack) {
        return res.status(404).json({
          success: false,
          message: `Snack not found: ${item.snack}`,
        });
      }

      if (snack.quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${snack.name}`,
        });
      }

      const itemTotal = snack.price * item.quantity;
      totalAmount += itemTotal;

      processedItems.push({
        snack: snack._id,
        snackName: snack.name,
        snackImage: snack.image || "🍿",
        quantity: item.quantity,
        unitPrice: snack.price,
        totalPrice: itemTotal,
        costPrice: snack.costPrice || 0,
      });
    }

    // Create sale with minimal data (no pre-save hooks complications)
    const saleData = {
      customer: req.user.id,
      customerName: user.name,
      items: processedItems,
      totalAmount: totalAmount,
      totalCost: processedItems.reduce(
        (sum, item) => sum + item.costPrice * item.quantity,
        0
      ),
      profit: 0, // Will be calculated after
      paymentMethod: paymentMethod,
      paymentStatus: "completed",
      status: "confirmed",
      notes: notes,
      location: {
        room: location.room || "",
        hostel: location.hostel || "",
      },
      saleId: `SALE-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 5)
        .toUpperCase()}`,
    };

    // Calculate profit
    saleData.profit = saleData.totalAmount - saleData.totalCost;

    console.log("Creating sale with data:", JSON.stringify(saleData, null, 2));

    // Create sale using direct MongoDB insert (bypass Mongoose pre-save)
    const sale = await Sale.create(saleData);

    console.log("Sale created successfully:", sale._id);

    // Update stock (async, don't wait)
    processedItems.forEach(async (item) => {
      try {
        await Snack.findByIdAndUpdate(item.snack, {
          $inc: {
            quantity: -item.quantity,
            sales: item.quantity,
            revenue: item.totalPrice,
          },
        });
      } catch (error) {
        console.error("Stock update error:", error);
      }
    });

    // Update user stats (async, don't wait)
    User.findByIdAndUpdate(req.user.id, {
      $inc: {
        totalPurchases: 1,
        totalSpent: totalAmount,
      },
    }).catch((err) => console.error("User update error:", err));

    return res.status(201).json({
      success: true,
      message: "Purchase completed successfully",
      data: {
        _id: sale._id,
        saleId: sale.saleId,
        totalAmount: sale.totalAmount,
        status: sale.status,
        items: sale.items,
        createdAt: sale.createdAt,
      },
    });
  } catch (error) {
    console.error("Sale creation error:", error);
    return res.status(500).json({
      success: false,
      message: "Sale creation failed: " + error.message,
      error: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

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
