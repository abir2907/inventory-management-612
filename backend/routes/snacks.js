// routes/snacks.js - Updated import for alternative upload middleware
const express = require("express");
const { body, query, validationResult } = require("express-validator");
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

// ... (keep all other routes the same until the POST route)

// @route   POST /api/snacks
// @desc    Create new snack
// @access  Private (Admin)
router.post(
  "/",
  [auth, adminAuth],
  upload.single("image"),
  uploadToCloudinaryMiddleware, // Add this middleware after multer
  [
    body("name").trim().isLength({ min: 1 }).withMessage("Name is required"),
    body("category")
      .isIn([
        "chips",
        "chocolate",
        "drinks",
        "cookies",
        "candy",
        "healthy",
        "other",
      ])
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
      .isIn([
        "chips",
        "chocolate",
        "drinks",
        "cookies",
        "candy",
        "healthy",
        "other",
      ])
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

module.exports = router;
