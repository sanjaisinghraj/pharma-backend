// backend/controllers/queryController.js
const Query = require("../models/Query");

exports.run = async (req, res) => {
  try {
    const { prompt, agents = [] } = req.body || {};
    if (!prompt) return res.status(400).json({ error: "Prompt is required" });

    // TODO: call your live connectors here (ClinicalTrials.gov, PubMed, etc.)
    // For now, return a safe mock and save the request.
    const summary = {
      prompt,
      agents,
      notes: [
        "Scanned ClinicalTrials.gov, PubMed, Patents, PubChem and OpenAlex.",
        "Replace this mock in utils/liveConnectors.js later."
      ]
    };

    const q = await Query.create({
      user: req.user.id,
      prompt,
      agents,
      summary,
      pdfPath: ""  // when ReportGenerator adds a file, store path here
    });

    res.json({ ok: true, summary, pdfPath: q.pdfPath || "" });
  } catch (err) {
    console.error("Run error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.history = async (req, res) => {
  try {
    const items = await Query.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ items });
  } catch (err) {
    console.error("History error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
