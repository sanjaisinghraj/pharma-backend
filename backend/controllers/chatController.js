// backend/controllers/chatController.js
const Conversation = require("../models/Conversation");
const gptAgent = require("../utils/gptAgent");
const { generateChatPDF } = require("../utils/reportGenerator");

exports.list = async (req, res) => {
  try {
    const rows = await Conversation.find({ userId: req.user.id })
      .select("_id title updatedAt")
      .sort({ updatedAt: -1 })
      .limit(100);
    res.json({ items: rows });
  } catch (e) {
    console.error("List chats error:", e);
    res.status(500).json({ error: "Server error" });
  }
};

exports.newChat = async (req, res) => {
  try {
    const c = await Conversation.create({
      userId: req.user.id,
      title: req.body.title || "New chat",
      messages: []
    });
    res.json({ id: c._id, title: c.title });
  } catch (e) {
    console.error("New chat error:", e);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getChat = async (req, res) => {
  try {
    const c = await Conversation.findOne({ _id: req.params.id, userId: req.user.id });
    if (!c) return res.status(404).json({ error: "Not found" });
    res.json(c);
  } catch (e) {
    console.error("Get chat error:", e);
    res.status(500).json({ error: "Server error" });
  }
};

exports.sendChat = async (req, res) => {
  try {
    const { message, convoId } = req.body || {};
    if (!message) return res.status(400).json({ error: "Message is required" });

    // If convoId provided, append; else create new convo on the fly
    let convo = null;
    if (convoId) {
      convo = await Conversation.findOne({ _id: convoId, userId: req.user.id });
      if (!convo) return res.status(404).json({ error: "Conversation not found" });
    } else {
      convo = await Conversation.create({
        userId: req.user.id,
        title: message.slice(0, 60),
        messages: []
      });
    }

    // push user message
    convo.messages.push({ role: "user", text: message });
    let aiText = "";
    try {
      aiText = await gptAgent({ message, user: req.user });
    } catch (err) {
      console.error("Chat Error:", err);
      aiText = "⚠️ Chat processing error. If you use Groq, check GROQ_API_KEY & quota.";
    }
    // push ai message
    convo.messages.push({ role: "ai", text: aiText });
    await convo.save();

    return res.json({
      convoId: convo._id,
      userMessage: message,
      aiMessage: aiText
    });

  } catch (err) {
    console.error("Chat Error:", err);
    return res.status(500).json({ error: "Chat processing error" });
  }
};

exports.pdf = async (req, res) => {
  try {
    const convo = await Conversation.findOne({ _id: req.params.id, userId: req.user.id });
    if (!convo) return res.status(404).json({ error: "Not found" });

    const link = await generateChatPDF(convo);
    res.json({ pdfPath: link });
  } catch (e) {
    console.error("Chat PDF error:", e);
    res.status(500).json({ error: "Server error" });
  }
};
