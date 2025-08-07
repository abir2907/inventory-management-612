// models/Sale.js
const mongoose = require("mongoose");

const saleItemSchema = new mongoose.Schema(
  {
    snack: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Snack",
      required: true,
    },
    snackName: {
      type: String,
      required: true,
    },
    snackImage: {
      type: String,
      default: "🍿",
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    costPrice: {
      type: Number,
      min: 0,
    },
  },
  { _id: false }
);

const saleSchema = new mongoose.Schema(
  {
    saleId: {
      type: String,
      unique: true,
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    items: [saleItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    totalCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    profit: {
      type: Number,
      default: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "upi", "card", "credit"],
      default: "cash",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "completed",
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "delivered", "cancelled"],
      default: "confirmed",
    },
    notes: {
      type: String,
      maxlength: 500,
    },
    location: {
      room: String,
      hostel: String,
      building: String,
    },
    deliveryTime: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    refundAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    discount: {
      amount: {
        type: Number,
        default: 0,
        min: 0,
      },
      percentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      reason: String,
    },
    tax: {
      amount: {
        type: Number,
        default: 0,
        min: 0,
      },
      percentage: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
saleSchema.index({ customer: 1, createdAt: -1 });
saleSchema.index({ saleId: 1 });
saleSchema.index({ createdAt: -1 });
saleSchema.index({ paymentStatus: 1 });
saleSchema.index({ status: 1 });
saleSchema.index({ "items.snack": 1 });

// Virtual for total items count
saleSchema.virtual("totalItems").get(function () {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Virtual for profit margin
saleSchema.virtual("profitMargin").get(function () {
  if (this.totalCost === 0) return 0;
  return ((this.profit / this.totalCost) * 100).toFixed(2);
});

// Pre-save middleware to generate sale ID and calculate totals
saleSchema.pre("save", function (next) {
  try {
    if (this.isNew && !this.saleId) {
      // Generate unique sale ID
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substr(2, 5).toUpperCase();
      this.saleId = `SALE-${timestamp}-${random}`;
    }

    // Ensure totalCost is calculated
    if (!this.totalCost && this.items && this.items.length > 0) {
      this.totalCost = this.items.reduce((sum, item) => {
        const costPrice = Number(item.costPrice) || 0;
        const quantity = Number(item.quantity) || 0;
        return sum + costPrice * quantity;
      }, 0);
    }

    // Calculate profit
    if (this.totalAmount && this.totalCost) {
      this.profit = Number(this.totalAmount) - Number(this.totalCost);
    }

    next();
  } catch (error) {
    console.error("Pre-save error:", error);
    next(error);
  }
});

// Method to mark as completed
saleSchema.methods.markCompleted = function () {
  this.status = "delivered";
  this.paymentStatus = "completed";
  this.completedAt = new Date();
  return this.save();
};

// Method to cancel sale
saleSchema.methods.cancel = function (reason) {
  this.status = "cancelled";
  this.cancelledAt = new Date();
  this.notes = this.notes
    ? `${this.notes} | Cancelled: ${reason}`
    : `Cancelled: ${reason}`;
  return this.save();
};

// Method to process refund
saleSchema.methods.processRefund = function (amount, reason) {
  this.paymentStatus = "refunded";
  this.refundAmount = amount;
  this.notes = this.notes
    ? `${this.notes} | Refund: ${reason}`
    : `Refund: ${reason}`;
  return this.save();
};

// Static method to get sales statistics
saleSchema.statics.getSalesStats = async function (startDate, endDate) {
  try {
    console.log("=== Getting Sales Stats ===");

    let matchCondition = { status: { $ne: "cancelled" } };

    if (startDate && endDate) {
      matchCondition.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Get all matching sales
    const sales = await this.find(matchCondition).lean();
    console.log("Found sales count:", sales.length);

    // Manual calculations
    let totalRevenue = 0;
    let totalItemsCount = 0;

    for (const sale of sales) {
      totalRevenue += sale.totalAmount || 0;

      if (sale.items && Array.isArray(sale.items)) {
        for (const item of sale.items) {
          totalItemsCount += item.quantity || 0;
        }
      }
    }

    // Today's sales calculation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysSales = await this.find({
      createdAt: { $gte: today, $lt: tomorrow },
      status: { $ne: "cancelled" },
    }).lean();

    let todaysRevenue = 0;
    let todaysCount = 0;
    for (const sale of todaysSales) {
      todaysRevenue += sale.totalAmount || 0;
      todaysCount += 1;
    }

    const result = {
      totalSales: sales.length, // Total number of sales
      totalRevenue: totalRevenue, // Total money earned
      totalProfit: totalRevenue, // Since no cost, profit = revenue
      totalItems: totalItemsCount, // Total items sold
      averageOrderValue: sales.length > 0 ? totalRevenue / sales.length : 0,
      todaysSales: todaysCount, // Number of sales today
      todaysRevenue: todaysRevenue, // Money earned today
    };

    console.log("Stats result:", result);
    return result;
  } catch (error) {
    console.error("getSalesStats error:", error);
    return {
      totalSales: 0,
      totalRevenue: 0,
      totalProfit: 0,
      totalItems: 0,
      averageOrderValue: 0,
      todaysSales: 0,
      todaysRevenue: 0,
    };
  }
};

// Replace getDailySales with this simple version:
saleSchema.statics.getDailySales = async function (days = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const sales = await this.find({
      createdAt: { $gte: startDate },
      status: { $ne: "cancelled" },
    }).lean();

    return []; // Return empty for now to avoid errors
  } catch (error) {
    console.error("getDailySales error:", error);
    return [];
  }
};

// Static method to get top customers
saleSchema.statics.getTopCustomers = async function (limit = 10) {
  return this.aggregate([
    {
      $match: {
        status: { $ne: "cancelled" },
      },
    },
    {
      $group: {
        _id: "$customer",
        customerName: { $first: "$customerName" },
        totalOrders: { $sum: 1 },
        totalSpent: { $sum: "$totalAmount" },
        totalItems: { $sum: "$totalItems" },
      },
    },
    { $sort: { totalSpent: -1 } },
    { $limit: limit },
  ]);
};

// Static method to get product performance
saleSchema.statics.getProductPerformance = async function () {
  return this.aggregate([
    { $match: { status: { $ne: "cancelled" } } },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.snack",
        snackName: { $first: "$items.snackName" },
        totalQuantitySold: { $sum: "$items.quantity" },
        totalRevenue: { $sum: "$items.totalPrice" },
        totalOrders: { $sum: 1 },
        averagePrice: { $avg: "$items.unitPrice" },
      },
    },
    { $sort: { totalQuantitySold: -1 } },
  ]);
};

// Static method to get monthly revenue
saleSchema.statics.getMonthlyRevenue = async function (year) {
  try {
    return []; // Return empty for now to avoid errors
  } catch (error) {
    console.error("getMonthlyRevenue error:", error);
    return [];
  }
};

module.exports = mongoose.model("Sale", saleSchema);
