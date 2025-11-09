// backend/controllers/authController.js
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";

exports.register = async (req, res) => {
  try {
    let { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ error: "missing fields" });
    }

    email = String(email).toLowerCase().trim();

    const existing = await User.findOne({ email });
    if (existing) {
      // Frontend already shows `data.error`, keep key stable:
      return res.status(409).json({ error: "user exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({ name: name.trim(), email, passwordHash });
    await user.save();

    return res.json({ message: "registered" });
  } catch (err) {
    console.error("Auth Register Error:", err);
    return res.status(500).json({ error: "server error" });
  }
};

exports.login = async (req, res) => {
  try {
    let { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "missing fields" });
    }

    email = String(email).toLowerCase().trim();

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(400).json({ error: "invalid credentials" });

    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name, role: user.role || "user" },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.json({
      token,
      user: { id: user._id, email: user.email, name: user.name, role: user.role || "user" },
    });
  } catch (err) {
    console.error("Auth Login Error:", err);
    return res.status(500).json({ error: "server error" });
  }
};
