// routes/snacks.js - Updated import for alternative upload middleware
const express = require("express");
const { body, validationResult } = require("express-validator");
const QRCode = require("qrcode");
const Snack = require("../models/Snack");
const Sale = require("../models/Sale");
const auth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");
const {
  upload,
  uploadToCloudinaryMiddleware,
  handleUploadError,
} = require("../middleware/upload");

const router = express.Router();

// @route   GET /api/snacks
// @desc    Get all snacks with filtering and pagination
// @access  Public
router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      category = "",
      sortBy = "createdAt",
      sortOrder = "desc",
      isActive = "true",
    } = req.query;

    // Build query
    let query = {};

    // Search by name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by category
    if (category) {
      query.category = category;
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

    const [snacks, total] = await Promise.all([
      Snack.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit))
        .populate("createdBy", "name")
        .lean(),
      Snack.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: snacks,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Get snacks error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   GET /api/snacks/stats
// @desc    Get inventory statistics
// @access  Private (Admin)
// @route   GET /api/snacks/stats
// @desc    Get inventory statistics
// @access  Private (Admin)
router.get("/stats", [auth, adminAuth], async (req, res) => {
  try {
    console.log("=== Fetching all snack stats (Definitive Version) ===");

    const results = await Promise.allSettled([
      Snack.getInventoryStats(),
      Snack.getLowStockItems(),
      Snack.getOutOfStockItems(),
      Snack.getTopSelling(10),
      Snack.getTopByRevenue(10),
      Snack.getTopByCategory(5),
      Snack.getCategoryStats(),
    ]);

    const getValue = (result, defaultValue) =>
      result.status === "fulfilled" ? result.value : defaultValue;

    const stats = getValue(results[0], {});
    const lowStockItems = getValue(results[1], []);
    const outOfStockItems = getValue(results[2], []);
    const topSelling = getValue(results[3], []);
    const topByRevenue = getValue(results[4], []);
    const topByCategory = getValue(results[5], []);
    const categoryStats = getValue(results[6], []);

    // --- NEW CONSOLE LOGS TO CONFIRM DATA ---
    console.log(`\n--- Confirming Data Before Response ---`);
    console.log(`topByRevenue contains ${topByRevenue.length} items.`);
    console.log(`topByCategory contains ${topByCategory.length} items.`);
    console.log(`categoryStats contains ${categoryStats.length} items.\n`);
    // --- END OF NEW LOGS ---

    const responseData = {
      overall: stats,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
      lowStockItems,
      outOfStockItems,
      topSelling,
      topByRevenue,
      topByCategory,
      categoryStats,
    };

    console.log("Final response object is complete. Sending to client.");

    res.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Error in /api/snacks/stats route:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching snack stats",
    });
  }
});

// Add this route TEMPORARILY after the existing stats route
router.get("/debug-aggregation", [auth, adminAuth], async (req, res) => {
  try {
    console.log("=== DEBUG: Testing Fixed Aggregations ===");

    // Test 1: Direct Sale collection query
    const Sale = require("../models/Sale");
    const sampleSales = await Sale.find({
      status: { $in: ["completed", "confirmed", "delivered"] },
    })
      .limit(2)
      .lean();

    console.log("Sample sales:", sampleSales);

    // Test 2: Test new aggregation methods
    const topRevenue = await Snack.getTopByRevenue(5);
    const topCategory = await Snack.getTopByCategory(3);
    const categoryStats = await Snack.getCategoryStats();

    res.json({
      success: true,
      debug: {
        sampleSalesCount: sampleSales.length,
        sampleSale: sampleSales[0] || null,
        topRevenue: {
          count: topRevenue.length,
          data: topRevenue,
        },
        topCategory: {
          count: topCategory.length,
          data: topCategory,
        },
        categoryStats: {
          count: categoryStats.length,
          data: categoryStats,
        },
      },
    });
  } catch (error) {
    console.error("Debug aggregation error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
      stack: error.stack,
    });
  }
});

// @route   GET /api/snacks/low-stock
// @desc    Get low stock items
// @access  Private
router.get("/low-stock", auth, async (req, res) => {
  try {
    const lowStockItems = await Snack.getLowStockItems();
    res.json({
      success: true,
      data: lowStockItems,
    });
  } catch (error) {
    console.error("Get low stock error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   GET /api/snacks/:id
// @desc    Get single snack
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const snack = await Snack.findById(req.params.id)
      .populate("createdBy", "name")
      .populate("reviews.user", "name avatar");

    if (!snack || !snack.isActive) {
      return res.status(404).json({
        success: false,
        message: "Snack not found",
      });
    }

    res.json({
      success: true,
      data: snack,
    });
  } catch (error) {
    console.error("Get snack error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// ... (keep all other routes the same until the POST route)

// @route   POST /api/snacks
// @desc    Create new snack
// @access  Private (Admin)
router.post(
  "/",
  [auth, adminAuth],
  upload.single("image"),
  uploadToCloudinaryMiddleware,
  [
    body("name").trim().isLength({ min: 1 }).withMessage("Name is required"),
    body("category")
      .isIn(["chips", "sweets", "instant meals", "other"])
      .withMessage("Invalid category"),
    body("price")
      .isFloat({ min: 0 })
      .withMessage("Price must be a positive number"),
    body("quantity")
      .isInt({ min: 0 })
      .withMessage("Quantity must be a non-negative integer"),
    body("lowStockAlert")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Low stock alert must be a non-negative integer"),
    body("description").optional().trim(),
    body("image").optional().trim(),
    body("costPrice")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Cost price must be a positive number"),
    body("expiryDate")
      .optional()
      .isISO8601()
      .withMessage("Invalid expiry date"),
    body("barcode").optional().trim(),
    body("tags").optional().isArray(),
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

      const snackData = {
        ...req.body,
        createdBy: req.user.id,
      };

      // Handle image upload
      if (req.file && req.file.path) {
        snackData.imageUrl = req.file.path; // Cloudinary URL
      }

      // Handle tags
      if (req.body.tags && typeof req.body.tags === "string") {
        snackData.tags = req.body.tags
          .split(",")
          .map((tag) => tag.trim().toLowerCase());
      }

      const snack = new Snack(snackData);
      await snack.save();

      await snack.populate("createdBy", "name");

      res.status(201).json({
        success: true,
        message: "Snack created successfully",
        data: snack,
      });
    } catch (error) {
      console.error("Create snack error:", error);

      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "Snack with this barcode already exists",
        });
      }

      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

// @route   PUT /api/snacks/:id
// @desc    Update snack
// @access  Private (Admin)
router.put(
  "/:id",
  [auth, adminAuth],
  upload.single("image"),
  uploadToCloudinaryMiddleware, // Add this middleware after multer
  [
    body("name")
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage("Name cannot be empty"),
    body("category")
      .optional()
      .isIn(["chips", "sweets", "instant meals", "other"])
      .withMessage("Invalid category"),
    body("price")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Price must be a positive number"),
    body("quantity")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Quantity must be a non-negative integer"),
    body("lowStockAlert")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Low stock alert must be a non-negative integer"),
    body("costPrice")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Cost price must be a positive number"),
    body("expiryDate")
      .optional()
      .isISO8601()
      .withMessage("Invalid expiry date"),
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

      const snack = await Snack.findById(req.params.id);
      if (!snack || !snack.isActive) {
        return res.status(404).json({
          success: false,
          message: "Snack not found",
        });
      }

      // Update fields
      Object.keys(req.body).forEach((key) => {
        if (req.body[key] !== undefined) {
          snack[key] = req.body[key];
        }
      });

      // Handle image upload
      if (req.file && req.file.path) {
        snack.imageUrl = req.file.path;
      }

      // Handle tags
      if (req.body.tags && typeof req.body.tags === "string") {
        snack.tags = req.body.tags
          .split(",")
          .map((tag) => tag.trim().toLowerCase());
      }

      await snack.save();
      await snack.populate("createdBy", "name");

      res.json({
        success: true,
        message: "Snack updated successfully",
        data: snack,
      });
    } catch (error) {
      console.error("Update snack error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

// ... (keep all other routes the same)
router.use(handleUploadError);
module.exports = router;
