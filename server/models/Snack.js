// models/Snack.js
const mongoose = require("mongoose");

const snackSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "chips",
        "chocolate",
        "cookies",
        "cake",
        "noodles",
        "namkeen",
        "other",
      ],
      lowercase: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    image: {
      type: String,
      default: "🍿",
    },
    imageUrl: {
      type: String,
      default: "",
    },
    barcode: {
      type: String,
      sparse: true,
      unique: true,
    },
    qrCode: {
      type: String,
    },
    lowStockAlert: {
      type: Number,
      default: 5,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sales: {
      type: Number,
      default: 0,
      min: 0,
    },
    revenue: {
      type: Number,
      default: 0,
      min: 0,
    },
    costPrice: {
      type: Number,
      min: 0,
    },
    expiryDate: {
      type: Date,
    },
    supplier: {
      name: String,
      contact: String,
    },
    tags: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],
    nutritionInfo: {
      calories: Number,
      fat: Number,
      carbs: Number,
      protein: Number,
      ingredients: [String],
    },
    reviews: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        comment: String,
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
snackSchema.index({ name: "text", description: "text", tags: "text" });
snackSchema.index({ category: 1 });
snackSchema.index({ isActive: 1 });
snackSchema.index({ quantity: 1 });
snackSchema.index({ sales: -1 });
snackSchema.index({ createdAt: -1 });

// Virtual for profit margin
snackSchema.virtual("profitMargin").get(function () {
  if (!this.costPrice) return 0;
  return (((this.price - this.costPrice) / this.costPrice) * 100).toFixed(2);
});

// Virtual for stock status
snackSchema.virtual("stockStatus").get(function () {
  if (this.quantity === 0) return "out_of_stock";
  if (this.quantity <= this.lowStockAlert) return "low_stock";
  return "in_stock";
});

// Virtual for total profit
snackSchema.virtual("totalProfit").get(function () {
  if (!this.costPrice) return 0;
  return (this.price - this.costPrice) * this.sales;
});

// Method to update stock after sale
snackSchema.methods.updateStock = function (quantitySold, saleAmount) {
  this.quantity = Math.max(0, this.quantity - quantitySold);
  this.sales += quantitySold;
  this.revenue += saleAmount;
  return this.save();
};

// Method to add stock
snackSchema.methods.addStock = function (quantityAdded) {
  this.quantity += quantityAdded;
  return this.save();
};

// Method to check if low stock
snackSchema.methods.isLowStock = function () {
  return this.quantity <= this.lowStockAlert && this.quantity > 0;
};

// Method to check if out of stock
snackSchema.methods.isOutOfStock = function () {
  return this.quantity === 0;
};

// Method to add review
snackSchema.methods.addReview = function (userId, rating, comment) {
  // Remove existing review from same user
  this.reviews = this.reviews.filter(
    (review) => review.user.toString() !== userId.toString()
  );

  // Add new review
  this.reviews.push({
    user: userId,
    rating: rating,
    comment: comment,
  });

  // Update average rating
  this.updateAverageRating();

  return this.save();
};

// Method to update average rating
snackSchema.methods.updateAverageRating = function () {
  if (this.reviews.length === 0) {
    this.averageRating = 0;
    return;
  }

  const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
  this.averageRating = (sum / this.reviews.length).toFixed(1);
};

// Static method to get low stock items
snackSchema.statics.getLowStockItems = function () {
  return this.find({
    isActive: true,
    $expr: { $lte: ["$quantity", "$lowStockAlert"] },
    quantity: { $gt: 0 },
  }).sort({ quantity: 1 });
};

// Static method to get out of stock items
snackSchema.statics.getOutOfStockItems = function () {
  return this.find({
    isActive: true,
    quantity: 0,
  }).sort({ updatedAt: -1 });
};

// Static method to get top selling items
snackSchema.statics.getTopSelling = function (limit = 10) {
  return this.find({ isActive: true }).sort({ sales: -1 }).limit(limit);
};

// Static method to get inventory stats
snackSchema.statics.getInventoryStats = async function () {
  const stats = await this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: null,
        totalItems: { $sum: 1 },
        totalQuantity: { $sum: "$quantity" },
        totalValue: { $sum: { $multiply: ["$price", "$quantity"] } },
        totalRevenue: { $sum: "$revenue" },
        lowStockItems: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $lte: ["$quantity", "$lowStockAlert"] },
                  { $gt: ["$quantity", 0] },
                ],
              },
              1,
              0,
            ],
          },
        },
        outOfStockItems: {
          $sum: { $cond: [{ $eq: ["$quantity", 0] }, 1, 0] },
        },
      },
    },
  ]);

  return (
    stats[0] || {
      totalItems: 0,
      totalQuantity: 0,
      totalValue: 0,
      totalRevenue: 0,
      lowStockItems: 0,
      outOfStockItems: 0,
    }
  );
};

// Pre-save middleware to generate QR code
snackSchema.pre("save", async function (next) {
  if (this.isNew || this.isModified("name") || this.isModified("price")) {
    // Generate QR code data
    this.qrCode = JSON.stringify({
      id: this._id,
      name: this.name,
      price: this.price,
      category: this.category,
    });
  }
  next();
});

module.exports = mongoose.model("Snack", snackSchema);
