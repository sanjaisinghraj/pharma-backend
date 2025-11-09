// backend/utils/gptAgent.js

const axios = require("axios");

/**
 * Generic GPT Agent using ANY OpenAI-compatible API
 * Works with free models from:
 * - Groq
 * - OpenRouter
 * - TogetherAI
 * - DeepSeek
 */
async function gptAgent(prompt) {
  try {
    const API_KEY = process.env.LLM_API_KEY;
    const API_URL = process.env.LLM_API_URL;
    const MODEL = process.env.LLM_MODEL || "gpt-4o-mini";

    if (!API_KEY || !API_URL) {
      throw new Error("LLM_API_KEY or LLM_API_URL missing");
    }

    const response = await axios.post(
      API_URL,
      {
        model: MODEL,
        messages: [
          { role: "system", content: "You are an expert pharma intelligence assistant." },
          { role: "user", content: prompt }
        ]
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`
        }
      }
    );

    const text = response.data.choices?.[0]?.message?.content || "No response";
    return text;

  } catch (err) {
    console.error("GPT Agent Error:", err.response?.data || err.message);
    return "⚠️ GPT Agent Error: " + (err.response?.data?.error?.message || err.message);
  }
}

module.exports = gptAgent;
