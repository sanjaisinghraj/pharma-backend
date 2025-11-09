// backend/utils/gptAgent.js
// GROQ version (no OpenAI)

const Groq = require("groq-sdk");

let groq = null;
const useGroq = !!process.env.GROQ_API_KEY;

if (useGroq) {
  groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
} else {
  console.warn("⚠️ GROQ_API_KEY missing. Falling back to mock responses.");
}

module.exports = async function gptAgent({ message, system, user }) {

  // ✅ Mock fallback
  if (!groq) {
    return [
      "🧪 Mock AI reply (no GROQ_API_KEY detected).",
      `You said: "${message}"`,
      "Add GROQ_API_KEY in Render to activate live LLaMA-3."
    ].join("\n");
  }

  const sysPrompt = system || "You are a pharma and biotech research assistant.";

  const usr = user ? ` (user: ${user.email || user.id})` : "";

  try {
    const completion = await groq.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [
        { role: "system", content: sysPrompt },
        { role: "user", content: `${message}${usr}` }
      ],
      temperature: 0.2
    });

    return completion.choices?.[0]?.message?.content || "No response.";
  } catch (err) {
    console.error("Groq API error:", err);
    return "❌ Groq API error. Please try again.";
  }
};
