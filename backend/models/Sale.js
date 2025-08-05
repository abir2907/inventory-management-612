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
  if (this.isNew) {
    // Generate unique sale ID
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    this.saleId = `SALE-${timestamp}-${random}`;
  }

  // Calculate totals
  this.totalAmount = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  this.totalCost = this.items.reduce(
    (sum, item) => sum + (item.costPrice || 0) * item.quantity,
    0
  );
  this.profit =
    this.totalAmount -
    this.totalCost -
    (this.discount.amount || 0) +
    (this.tax.amount || 0);

  // Apply discount
  if (this.discount.percentage > 0) {
    this.discount.amount = (this.totalAmount * this.discount.percentage) / 100;
    this.totalAmount -= this.discount.amount;
  }

  // Add tax
  if (this.tax.percentage > 0) {
    this.tax.amount = (this.totalAmount * this.tax.percentage) / 100;
    this.totalAmount += this.tax.amount;
  }

  next();
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
  const matchCondition = {
    status: { $ne: "cancelled" },
  };

  if (startDate && endDate) {
    matchCondition.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  const stats = await this.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: null,
        totalSales: { $sum: 1 },
        totalRevenue: { $sum: "$totalAmount" },
        totalProfit: { $sum: "$profit" },
        totalItems: { $sum: "$totalItems" },
        averageOrderValue: { $avg: "$totalAmount" },
      },
    },
  ]);

  return (
    stats[0] || {
      totalSales: 0,
      totalRevenue: 0,
      totalProfit: 0,
      totalItems: 0,
      averageOrderValue: 0,
    }
  );
};

// Static method to get daily sales
saleSchema.statics.getDailySales = async function (days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        status: { $ne: "cancelled" },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$createdAt",
          },
        },
        totalSales: { $sum: 1 },
        totalRevenue: { $sum: "$totalAmount" },
        totalProfit: { $sum: "$profit" },
      },
    },
    { $sort: { _id: 1 } },
  ]);
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
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year + 1, 0, 1);

  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lt: endDate },
        status: { $ne: "cancelled" },
      },
    },
    {
      $group: {
        _id: { $month: "$createdAt" },
        totalRevenue: { $sum: "$totalAmount" },
        totalProfit: { $sum: "$profit" },
        totalSales: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
};

module.exports = mongoose.model("Sale", saleSchema);
