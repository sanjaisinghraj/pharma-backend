// backend/utils/gptAgent.js
// Uses Groq if GROQ_API_KEY is set; otherwise returns a safe mock.

let groq = null;
const useGroq = !!process.env.GROQ_API_KEY;

if (useGroq) {
  try {
    const { Groq } = require("groq-sdk");
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  } catch (e) {
    console.warn("Groq SDK not installed/loaded, falling back to mock.");
  }
}

module.exports = async function gptAgent({ message, system, user }) {
  // Fallback mock if no key/Groq
  if (!groq) {
    return [
      "🧪 Mock AI reply (no GROQ_API_KEY).",
      `You said: "${message}"`,
      "Add GROQ_API_KEY on Render to call Llama-3.1 via Groq.",
    ].join("\n");
  }

  const sys = system || "You are a pharma innovation research assistant. Be concise and factual.";

  const completion = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL || "llama-3.1-70b-versatile",
    messages: [
      { role: "system", content: sys },
      { role: "user", content: message }
    ],
    temperature: 0.2
  });

  return completion.choices?.[0]?.message?.content?.trim() || "No response.";
};
