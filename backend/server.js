// =======================
// SERVER.JS for Render
// =======================

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Create app
const app = express();

// ------------------------
// CORS CONFIG (IMPORTANT)
// ------------------------
const allowedOrigins = [
  "https://your-solution.space",
  "https://www.your-solution.space"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow server-to-server or non-browser requests
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        console.log("❌ BLOCKED CORS origin:", origin);
        return callback(new Error("CORS blocked for " + origin), false);
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })
);

// Preflight
app.options("*", cors());

// ------------------------
// BODY PARSER
// ------------------------
app.use(express.json());

// ------------------------
// MONGO CONNECTION
// ------------------------
const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI, {
    dbName: "pharmaintel",
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });

// ------------------------
// HEALTH CHECK ROUTE
// ------------------------
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// ------------------------
// LOAD ROUTES
// ------------------------
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

//const moleculeRoutes = require("./routes/moleculeRoutes");
//app.use("/api/molecule", moleculeRoutes);

// Add more routes as needed...

// ------------------------
// START SERVER
// ------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`✅ Server running on port ${PORT}`)
);
