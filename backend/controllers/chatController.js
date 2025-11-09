// backend/controllers/chatController.js
const gptAgent = require("../utils/gptAgent");

exports.sendChat = async (req, res) => {
  try {
    const { message, system } = req.body || {};
    if (!message) return res.status(400).json({ error: "Message is required" });

    // optional user context from auth middleware
    const userCtx = req.user ? { id: req.user.id, email: req.user.email, name: req.user.name } : null;

    const reply = await gptAgent({ message, system, user: userCtx });

    return res.json({ userMessage: message, aiMessage: reply });
  } catch (err) {
    console.error("Chat Error:", err);
    return res.status(500).json({ error: "Chat processing error" });
  }
};
