// backend/utils/gptAgent.js
// Uses OpenAI if OPENAI_API_KEY is set; otherwise returns a safe mock.

let openai = null;
const useOpenAI = !!process.env.OPENAI_API_KEY;

if (useOpenAI) {
  try {
    const { OpenAI } = require("openai");
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  } catch (e) {
    console.warn("OpenAI SDK not installed or failed to load. Falling back to mock.");
  }
}

module.exports = async function gptAgent({ message, system, user }) {
  // Fallback mock if no key/OpenAI
  if (!openai) {
    return [
      "🧪 Mock AI reply (no OPENAI_API_KEY).",
      `You said: "${message}"`,
      "When you add OPENAI_API_KEY on Render, this will call a GPT model.",
    ].join("\n");
  }

  const sys = system || "You are a pharma innovation research assistant. Be concise and factual.";
  const userLine = user ? ` (user:${user.email || user.id})` : "";

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      { role: "system", content: sys },
      { role: "user", content: `${message}${userLine}` },
    ],
    temperature: 0.2,
  });

  return completion.choices?.[0]?.message?.content?.trim() || "No response.";
};
