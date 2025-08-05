// scripts/seed.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");
const Snack = require("../models/Snack");
const Sale = require("../models/Sale");

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/snack-inventory"
    );
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

const seedUsers = async () => {
  try {
    // Clear existing users
    await User.deleteMany({});
    console.log("Cleared existing users");

    const users = [
      {
        name: "Admin User",
        email: process.env.ADMIN_EMAIL || "admin@snackhub.com",
        password: "admin123",
        role: "admin",
        hostelRoom: "Admin Office",
        phoneNumber: "+91-9876543210",
      },
      {
        name: "Rahul Kumar",
        email: "rahul@example.com",
        password: "customer123",
        role: "customer",
        hostelRoom: "A-101",
        phoneNumber: "+91-9876543211",
        totalPurchases: 15,
        totalSpent: 750,
      },
      {
        name: "Priya Sharma",
        email: "priya@example.com",
        password: "customer123",
        role: "customer",
        hostelRoom: "B-205",
        phoneNumber: "+91-9876543212",
        totalPurchases: 8,
        totalSpent: 420,
      },
      {
        name: "Amit Singh",
        email: "amit@example.com",
        password: "customer123",
        role: "customer",
        hostelRoom: "C-303",
        phoneNumber: "+91-9876543213",
        totalPurchases: 12,
        totalSpent: 680,
      },
      {
        name: "Sneha Patel",
        email: "sneha@example.com",
        password: "customer123",
        role: "customer",
        hostelRoom: "A-208",
        phoneNumber: "+91-9876543214",
        totalPurchases: 6,
        totalSpent: 290,
      },
    ];

    const createdUsers = await User.insertMany(users);
    console.log(`Created ${createdUsers.length} users`);
    return createdUsers;
  } catch (error) {
    console.error("Error seeding users:", error);
    throw error;
  }
};

const seedSnacks = async (adminUser) => {
  try {
    // Clear existing snacks
    await Snack.deleteMany({});
    console.log("Cleared existing snacks");

    const snacks = [
      {
        name: "Lays Classic",
        description: "Crispy potato chips with classic flavor",
        category: "chips",
        price: 20,
        quantity: 25,
        image: "🍟",
        sales: 45,
        revenue: 900,
        lowStockAlert: 5,
        costPrice: 12,
        tags: ["crispy", "potato", "salty"],
        createdBy: adminUser._id,
        barcode: "8901030702345",
      },
      {
        name: "Dairy Milk Chocolate",
        description: "Smooth and creamy milk chocolate",
        category: "chocolate",
        price: 45,
        quantity: 18,
        image: "🍫",
        sales: 32,
        revenue: 1440,
        lowStockAlert: 3,
        costPrice: 30,
        tags: ["chocolate", "sweet", "dairy"],
        createdBy: adminUser._id,
        barcode: "8901030702346",
      },
      {
        name: "Coca Cola",
        description: "Refreshing cola drink",
        category: "drinks",
        price: 35,
        quantity: 12,
        image: "🥤",
        sales: 28,
        revenue: 980,
        lowStockAlert: 5,
        costPrice: 22,
        tags: ["cola", "fizzy", "refreshing"],
        createdBy: adminUser._id,
        barcode: "8901030702347",
      },
      {
        name: "Oreo Cookies",
        description: "Chocolate cream cookies",
        category: "cookies",
        price: 25,
        quantity: 20,
        image: "🍪",
        sales: 38,
        revenue: 950,
        lowStockAlert: 4,
        costPrice: 16,
        tags: ["cookies", "chocolate", "cream"],
        createdBy: adminUser._id,
        barcode: "8901030702348",
      },
      {
        name: "Maggi Noodles",
        description: "2-minute instant noodles",
        category: "other",
        price: 15,
        quantity: 30,
        image: "🍜",
        sales: 52,
        revenue: 780,
        lowStockAlert: 8,
        costPrice: 10,
        tags: ["noodles", "instant", "masala"],
        createdBy: adminUser._id,
        barcode: "8901030702349",
      },
      {
        name: "Kurkure",
        description: "Crunchy corn puffs",
        category: "chips",
        price: 18,
        quantity: 22,
        image: "🌽",
        sales: 41,
        revenue: 738,
        lowStockAlert: 6,
        costPrice: 11,
        tags: ["corn", "crunchy", "spicy"],
        createdBy: adminUser._id,
        barcode: "8901030702350",
      },
      {
        name: "Pepsi",
        description: "Cool refreshing cola",
        category: "drinks",
        price: 35,
        quantity: 8,
        image: "🥤",
        sales: 24,
        revenue: 840,
        lowStockAlert: 5,
        costPrice: 22,
        tags: ["cola", "pepsi", "cold"],
        createdBy: adminUser._id,
        barcode: "8901030702351",
      },
      {
        name: "Good Day Biscuits",
        description: "Butter cookies with sugar crystals",
        category: "cookies",
        price: 12,
        quantity: 35,
        image: "🍪",
        sales: 67,
        revenue: 804,
        lowStockAlert: 10,
        costPrice: 8,
        tags: ["biscuits", "butter", "sweet"],
        createdBy: adminUser._id,
        barcode: "8901030702352",
      },
      {
        name: "KitKat",
        description: "Crispy wafer chocolate bar",
        category: "chocolate",
        price: 40,
        quantity: 15,
        image: "🍫",
        sales: 29,
        revenue: 1160,
        lowStockAlert: 4,
        costPrice: 26,
        tags: ["chocolate", "wafer", "kitkat"],
        createdBy: adminUser._id,
        barcode: "8901030702353",
      },
      {
        name: "Frooti",
        description: "Mango flavored drink",
        category: "drinks",
        price: 30,
        quantity: 16,
        image: "🥭",
        sales: 33,
        revenue: 990,
        lowStockAlert: 5,
        costPrice: 19,
        tags: ["mango", "fruity", "sweet"],
        createdBy: adminUser._id,
        barcode: "8901030702354",
      },
      {
        name: "Pringles",
        description: "Stackable potato crisps",
        category: "chips",
        price: 80,
        quantity: 5,
        image: "🥔",
        sales: 18,
        revenue: 1440,
        lowStockAlert: 3,
        costPrice: 55,
        tags: ["potato", "premium", "stackable"],
        createdBy: adminUser._id,
        barcode: "8901030702355",
      },
      {
        name: "Parle-G",
        description: "Glucose biscuits",
        category: "cookies",
        price: 8,
        quantity: 40,
        image: "🍪",
        sales: 89,
        revenue: 712,
        lowStockAlert: 15,
        costPrice: 5,
        tags: ["glucose", "healthy", "classic"],
        createdBy: adminUser._id,
        barcode: "8901030702356",
      },
    ];

    const createdSnacks = await Snack.insertMany(snacks);
    console.log(`Created ${createdSnacks.length} snacks`);
    return createdSnacks;
  } catch (error) {
    console.error("Error seeding snacks:", error);
    throw error;
  }
};

// Helper function to generate unique sale ID
const generateSaleId = () => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substr(2, 5).toUpperCase();
  return `SALE-${timestamp}-${random}`;
};

const seedSales = async (users, snacks) => {
  try {
    // Clear existing sales
    await Sale.deleteMany({});
    console.log("Cleared existing sales");

    const customers = users.filter((user) => user.role === "customer");
    const salesCount = 50;
    let createdSalesCount = 0;

    // Generate random sales for the last 30 days
    const today = new Date();

    console.log(`Creating ${salesCount} sales...`);

    for (let i = 0; i < salesCount; i++) {
      try {
        const customer =
          customers[Math.floor(Math.random() * customers.length)];
        const numItems = Math.floor(Math.random() * 4) + 1; // 1-4 items per sale
        const saleItems = [];

        // Random date in the last 30 days
        const saleDate = new Date(
          today.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000
        );

        let totalAmount = 0;
        let totalCost = 0;

        for (let j = 0; j < numItems; j++) {
          const snack = snacks[Math.floor(Math.random() * snacks.length)];
          const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 quantity
          const itemTotal = snack.price * quantity;

          saleItems.push({
            snack: snack._id,
            snackName: snack.name,
            snackImage: snack.image,
            quantity: quantity,
            unitPrice: snack.price,
            totalPrice: itemTotal,
            costPrice: snack.costPrice || 0,
          });

          totalAmount += itemTotal;
          totalCost += (snack.costPrice || 0) * quantity;
        }

        // Create sale with manually generated saleId
        const sale = new Sale({
          saleId: generateSaleId(),
          customer: customer._id,
          customerName: customer.name,
          items: saleItems,
          totalAmount: totalAmount,
          totalCost: totalCost,
          profit: totalAmount - totalCost,
          paymentMethod: ["cash", "upi", "card"][Math.floor(Math.random() * 3)],
          status: ["confirmed", "delivered"][Math.floor(Math.random() * 2)],
          paymentStatus: "completed",
          location: {
            room: customer.hostelRoom,
            hostel: "Main Hostel",
            building: customer.hostelRoom?.charAt(0) || "A",
          },
          createdAt: saleDate,
          updatedAt: saleDate,
        });

        await sale.save();
        createdSalesCount++;

        // Show progress every 10 sales
        if (createdSalesCount % 10 === 0) {
          console.log(`Created ${createdSalesCount}/${salesCount} sales...`);
        }
      } catch (error) {
        console.error(`Error creating sale ${i + 1}:`, error.message);
        // Continue with next sale
      }
    }

    console.log(`Successfully created ${createdSalesCount} sales`);
    return createdSalesCount;
  } catch (error) {
    console.error("Error seeding sales:", error);
    throw error;
  }
};

const seedDatabase = async () => {
  try {
    await connectDB();

    console.log("🌱 Starting database seeding...");

    // Seed users
    const users = await seedUsers();
    const adminUser = users.find((user) => user.role === "admin");

    // Seed snacks
    const snacks = await seedSnacks(adminUser);

    // Seed sales
    const salesCount = await seedSales(users, snacks);

    console.log("✅ Database seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`👥 Users: ${users.length}`);
    console.log(`🍿 Snacks: ${snacks.length}`);
    console.log(`💰 Sales: ${salesCount}`);
    console.log("\n🔐 Login Credentials:");
    console.log("Admin: admin@snackhub.com / admin123");
    console.log("Customer: rahul@example.com / customer123");
    console.log("Customer: priya@example.com / customer123");
    console.log("Customer: amit@example.com / customer123");
    console.log("Customer: sneha@example.com / customer123");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
    process.exit(0);
  }
};

// Check if script is being run directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
