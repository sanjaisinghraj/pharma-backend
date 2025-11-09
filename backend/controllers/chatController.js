const gptAgent = require("../utils/gptAgent");

exports.sendChat = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    const reply = await gptAgent(message);

    return res.json({
      userMessage: message,
      aiMessage: reply
    });

  } catch (err) {
    console.error("Chat Error:", err);
    return res.status(500).json({ error: "Chat processing error" });
  }
};
