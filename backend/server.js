// backend/server.js
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();

/* ---------------- CORS ---------------- */
const allowedOrigins = [
  "https://your-solution.space",
  "https://www.your-solution.space",
  // For local dev only (comment out in prod):
  // "http://localhost:5500",
  // "http://127.0.0.1:5500",
];
app.use("/reports", express.static(path.join(__dirname, "reports")));

app.use(
  cors({
    origin(origin, cb) {
      // Allow server-to-server / curl / Postman (no Origin header)
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      console.log("❌ BLOCKED CORS origin:", origin);
      return cb(new Error("CORS blocked for " + origin), false);
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
// Preflight for all routes
app.options("*", cors());

// (Optional but safe on Render)
app.set("trust proxy", 1);

/* -------------- Body parser ----------- */
app.use(express.json({ limit: "2mb" }));

/* -------------- MongoDB --------------- */
const MONGO_URI = process.env.MONGO_URI;
mongoose
  .connect(MONGO_URI, { dbName: "pharmaintel" })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

/* -------------- Health ---------------- */
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

/* -------------- Routes ---------------- */
// ⬇️ Mount routes AFTER CORS and express.json
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/query", require("./routes/queryRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));   // ⬅️ moved here

/* -------------- Static (PDF reports) -- */
// Our report generator writes to backend/reports/*.pdf
const reportsDir = path.join(__dirname, "reports");
app.use("/reports", express.static(reportsDir));

/* -------------- Error handler --------- */
app.use((err, _req, res, _next) => {
  console.error("Server error:", err.message || err);
  const status = err.message && err.message.startsWith("CORS") ? 403 : 500;
  res.status(status).json({ error: err.message || "Server error" });
});

/* -------------- Start ----------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
