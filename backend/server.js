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
];

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);       // server-to-server / curl
      return allowedOrigins.includes(origin)
        ? cb(null, true)
        : cb(new Error("CORS blocked for " + origin), false);
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.options("*", cors());

/* -------------- Body parser ----------- */
app.use(express.json({ limit: "1mb" }));

/* -------------- MongoDB --------------- */
const MONGO_URI = process.env.MONGO_URI;
mongoose
  .connect(MONGO_URI, { dbName: "pharmaintel" })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

/* -------------- Health ---------------- */
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

/* -------------- Routes ---------------- */
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/query", require("./routes/queryRoutes"));

/* -------------- Static (optional PDFs) */
app.use("/files", express.static(path.join(__dirname, "files")));

/* -------------- Start ----------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
