// backend/controllers/authController.js
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";

// Utility: create JWT payload consistently
function makeToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: "8h" }
  );
}

// ---------------------
// POST /api/auth/register
// ---------------------
exports.register = async (req, res) => {
  try {
    const { name = "", email = "", password = "" } = req.body || {};

    // basic validation
    if (!email.trim() || !password.trim())
      return res.status(400).json({ error: "Email and password are required" });

    if (password.length < 6)
      return res.status(400).json({ error: "Password must be at least 6 characters" });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: "User already exists" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
    });
    await user.save();

    // You can auto-login after register if you want:
    // const token = makeToken(user);
    // return res.status(201).json({ message: "registered", token, user: { name: user.name, email: user.email, role: user.role }});

    return res.status(201).json({ message: "registered" });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// ---------------------
// POST /api/auth/login
// ---------------------
exports.login = async (req, res) => {
  try {
    const { email = "", password = "" } = req.body || {};
    if (!email.trim() || !password.trim())
      return res.status(400).json({ error: "Email and password are required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(400).json({ error: "Invalid credentials" });

    const token = makeToken(user);

    return res.json({
      token,
      user: { email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};
