// backend/controllers/chatController.js
const Conversation = require("../models/Conversation");
const gptAgent = require("../utils/gptAgent");

/**
 * List last 50 conversations for the user
 */
exports.history = async (req, res) => {
  try {
    const items = await Conversation.find({ userId: req.user.id })
      .select("_id title updatedAt")
      .sort({ updatedAt: -1 })
      .limit(50);
    res.json({ items });
  } catch (err) {
    console.error("history err:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Create a new empty conversation
 */
exports.newChat = async (req, res) => {
  try {
    const title = (req.body?.title || "New chat").trim();
    const conv = await Conversation.create({
      userId: req.user.id,
      title,
      messages: []
    });
    res.json({ id: conv._id, title: conv.title });
  } catch (err) {
    console.error("newChat err:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Get one conversation messages
 */
exports.getChat = async (req, res) => {
  try {
    const conv = await Conversation.findOne({ _id: req.params.id, userId: req.user.id });
    if (!conv) return res.status(404).json({ error: "Not found" });
    res.json({ id: conv._id, title: conv.title, messages: conv.messages });
  } catch (err) {
    console.error("getChat err:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Append user message, call GPT (or mock), append AI reply
 * Body: { convoId, message, system? }
 */
exports.sendChat = async (req, res) => {
  try {
    const { convoId, message, system } = req.body || {};
    if (!message) return res.status(400).json({ error: "Message is required" });

    let conv = null;
    if (convoId) {
      conv = await Conversation.findOne({ _id: convoId, userId: req.user.id });
      if (!conv) return res.status(404).json({ error: "Conversation not found" });
    } else {
      conv = await Conversation.create({ userId: req.user.id, title: "New chat", messages: [] });
    }

    // Add user message
    conv.messages.push({ role: "user", text: message });

    // Title from first user message
    if (conv.title === "New chat") {
      conv.title = message.substring(0, 80);
    }

    // Call GPT (or mock)
    const aiText = await gptAgent({
      message,
      system,
      user: { id: req.user.id, email: req.user.email, name: req.user.name }
    });

    // Add AI message
    conv.messages.push({ role: "ai", text: aiText });
    await conv.save();

    res.json({
      id: conv._id,
      title: conv.title,
      messages: conv.messages
    });
  } catch (err) {
    console.error("sendChat error:", err);
    res.status(500).json({ error: "Chat processing error" });
  }
};
