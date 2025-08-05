// models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      sparse: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["admin", "customer"],
      default: "customer",
    },
    password: {
      type: String,
      minlength: 6,
    },
    hostelRoom: {
      type: String,
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    preferences: {
      theme: {
        type: String,
        enum: ["light", "dark"],
        default: "light",
      },
      notifications: {
        email: { type: Boolean, default: true },
        lowStockAlerts: { type: Boolean, default: true },
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    totalPurchases: {
      type: Number,
      default: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better performance
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ role: 1 });

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile
userSchema.methods.getPublicProfile = function () {
  const user = this.toObject();
  delete user.password;
  delete user.googleId;
  return user;
};

// Method to update last login
userSchema.methods.updateLastLogin = function () {
  this.lastLogin = new Date();
  return this.save();
};

// Static method to find admin
userSchema.statics.findAdmin = function () {
  return this.findOne({ role: "admin" });
};

// Static method to get customer stats
userSchema.statics.getCustomerStats = async function () {
  const stats = await this.aggregate([
    { $match: { role: "customer" } },
    {
      $group: {
        _id: null,
        totalCustomers: { $sum: 1 },
        activeCustomers: { $sum: { $cond: ["$isActive", 1, 0] } },
        totalSpent: { $sum: "$totalSpent" },
        totalPurchases: { $sum: "$totalPurchases" },
      },
    },
  ]);

  return (
    stats[0] || {
      totalCustomers: 0,
      activeCustomers: 0,
      totalSpent: 0,
      totalPurchases: 0,
    }
  );
};

module.exports = mongoose.model("User", userSchema);
