// backend/utils/gptAgent.js
// Unified LLM adapter: OpenAI (paid), Groq (free tier), or safe mock.

let openai = null;
let groq = null;

const hasOpenAI = !!process.env.OPENAI_API_KEY;
const hasGroq   = !!process.env.GROQ_API_KEY;

if (hasOpenAI) {
  try {
    const { OpenAI } = require("openai");
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  } catch (e) {
    console.warn("OpenAI SDK not installed/loaded, will try Groq or mock:", e.message);
  }
}

if (!openai && hasGroq) {
  try {
    const Groq = require("groq-sdk");         // <- add dependency in package.json
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  } catch (e) {
    console.warn("Groq SDK not installed/loaded, will use mock:", e.message);
  }
}

function pleasantFallback(message) {
  return [
    "🧪 Mock AI reply (no working LLM key).",
    `You said: "${message}"`,
    "Add OPENAI_API_KEY (with billing) or GROQ_API_KEY on Render to enable live responses."
  ].join("\n");
}

module.exports = async function gptAgent({ message, system, user }) {
  const sys = system || "You are a pharma innovation research assistant. Be concise, factual and cite datasets if available.";
  const userTag = user ? ` (user:${user.email || user.id})` : "";

  // 1) OpenAI path
  if (openai) {
    try {
      const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
      const out = await openai.chat.completions.create({
        model,
        temperature: 0.2,
        messages: [
          { role: "system", content: sys },
          { role: "user", content: `${message}${userTag}` }
        ]
      });
      return out.choices?.[0]?.message?.content?.trim() || "No response.";
    } catch (err) {
      // If quota/billing error, fall through to Groq or mock
      if (err?.code === "insufficient_quota" || err?.status === 429) {
        console.warn("OpenAI quota/limit hit; falling back to Groq/mock.");
      } else {
        console.error("OpenAI error:", err);
      }
    }
  }

  // 2) Groq path (free tier)
  if (groq) {
    try {
      const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
      const out = await groq.chat.completions.create({
        model,
        temperature: 0.2,
        messages: [
          { role: "system", content: sys },
          { role: "user", content: `${message}${userTag}` }
        ]
      });
      return out.choices?.[0]?.message?.content?.trim() || "No response.";
    } catch (err) {
      console.error("Groq error:", err);
    }
  }

  // 3) Fallback mock
  return pleasantFallback(message);
};
