// backend/utils/gptAgent.js
const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // set in Render
});

const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
// ^ low-cost model; change to 'gpt-4o' if you have access.

/**
 * Ask the LLM with short history.
 * @param {string} prompt
 * @param {Array<{role:'user'|'assistant', content:string}>} history
 */
async function askLLM(prompt, history = []) {
  const messages = [
    {
      role: "system",
      content:
        "You are PharmaIntel AI, a pharma intelligence assistant. " +
        "Be concise, cite sources if explicitly provided in context, " +
        "and never fabricate data.",
    },
    ...history.slice(-12), // keep last few exchanges only
    { role: "user", content: prompt },
  ];

  const resp = await client.chat.completions.create({
    model: DEFAULT_MODEL,
    messages,
    temperature: 0.2,
  });

  return resp.choices?.[0]?.message?.content?.trim() || "Sorry, no answer.";
}

module.exports = { askLLM };
