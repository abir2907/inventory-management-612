// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const passport = require("passport");
const session = require("express-session");
const MongoStore = require("connect-mongo");

dotenv.config();

const app = express();

// Import routes
const authRoutes = require("./routes/auth");
const snackRoutes = require("./routes/snacks");
const salesRoutes = require("./routes/sales");
const userRoutes = require("./routes/users");

// Middleware
// server.js

app.use(
  cors({
    origin: [
      process.env.CLIENT_URL,
      "http://127.0.0.1:5173",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
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
mongoose
  .connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/snack-inventory",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/snacks", snackRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/users", userRoutes);

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
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
