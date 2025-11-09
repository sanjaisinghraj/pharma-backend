// backend/utils/gptAgent.js
// Uses OpenAI if OPENAI_API_KEY is set (and USE_OPENAI !== 'false').
// Falls back to a safe mock on any quota/rate-limit or if key not present.

let openai = null;

const wantOpenAI =
  !!process.env.OPENAI_API_KEY &&
  String(process.env.USE_OPENAI || "true").toLowerCase() !== "false";

if (wantOpenAI) {
  try {
    const { OpenAI } = require("openai");
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  } catch (e) {
    console.warn(
      "OpenAI SDK not installed or failed to load. Falling back to mock."
    );
  }
}

function mockReply(message) {
  return [
    "🧪 **Mock AI reply** (OpenAI disabled or quota exceeded).",
    `**You asked:** ${message}`,
    "",
    "This is a placeholder response so your workflow keeps running.",
    "Once you add credit/enabled billing on OpenAI and redeploy, real model outputs will appear here."
  ].join("\n");
}

module.exports = async function gptAgent({ message, system, user }) {
  // No SDK or OpenAI intentionally disabled
  if (!openai) return mockReply(message);

  const sys =
    system ||
    "You are a pharma innovation research assistant. Be concise and factual.";
  const userLine = user ? ` (user:${user.email || user.id})` : "";

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: sys },
        { role: "user", content: `${message}${userLine}` }
      ],
      temperature: 0.2
    });

    return (
      completion.choices?.[0]?.message?.content?.trim() ||
      mockReply(message)
    );
  } catch (err) {
    // Graceful fallback on quota/rate-limit/network issues
    const code = (err && (err.code || err.status)) || "";
    const msg = (err && err.message) || "";

    const isQuota =
      code === 429 ||
      /insufficient_quota|quota|rate limit/i.test(msg) ||
      /You exceeded your current quota/i.test(msg);

    if (isQuota) {
      console.warn("OpenAI quota/rate-limit hit. Returning mock reply.");
      return mockReply(message);
    }

    console.error("OpenAI error:", err);
    // Also fallback for any other unexpected errors (keeps app usable)
    return mockReply(message);
  }
};
