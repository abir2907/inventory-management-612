// server.js
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const connectToDatabase = require("./config/database.js");

const app = express();

// Import routes
const authRoutes = require("./routes/auth");
const snackRoutes = require("./routes/snacks");
const salesRoutes = require("./routes/sales");
const userRoutes = require("./routes/users");
const siteRoutes = require("./routes/site");

// Import models to ensure they're registered
require("./models/SiteStatus");

// Middleware
// server.js

app.use(
  cors({
    origin: [
      process.env.CLIENT_URL,
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl:
        process.env.MONGODB_URI || "mongodb://localhost:27017/snack-inventory",
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Passport config
require("./config/passport")(passport);

// MongoDB connection
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(500).json({ message: "Database connection error" });
  }
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/snacks", snackRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/users", userRoutes);
app.use("/api/site", siteRoutes);

app.get("/", (req, res) => {
  res.send("API Working");
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ message: "Server is running!", timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, _next) => {
  // Log the error in a safe way
  console.error(err || "An unknown error occurred");

  const statusCode = 500;
  const message = "Something went wrong on the server!";

  // Ensure we send a valid JSON response
  res.status(statusCode).json({
    success: false,
    message: message,
    // Only include stack in development for debugging
    error:
      process.env.NODE_ENV === "development" && err
        ? err.toString()
        : undefined,
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}...`);
});

module.exports = app;
