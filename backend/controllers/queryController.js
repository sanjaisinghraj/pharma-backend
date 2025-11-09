// backend/controllers/queryController.js
const Query = require("../models/Query");
const live = require("../utils/liveConnectors");
const { generatePDFSummary } = require("../utils/reportGenerator");

exports.run = async (req, res) => {
  try {
    const { prompt, agents = [] } = req.body || {};
    if (!prompt) return res.status(400).json({ error: "Prompt is required" });

    const use = new Set((agents || []).map(a => String(a).toLowerCase()));

    const raw = {};
    const highlights = [];

    // Clinical
    if (use.has("clinical")) {
      try {
        const ct = await live.fetchClinicalTrials(prompt, 1);
        const count = ct?.studies?.length || ct?.meta?.total || 0;
        raw.clinical = ct;
        highlights.push(`Clinical: trials found ${count}`);
      } catch (e) {
        raw.clinical = { error: e.message };
        highlights.push("Clinical: error fetching.");
      }
    }

    // PubMed
    if (use.has("pubmed")) {
      try {
        const pm = await live.fetchPubMed(prompt);
        const hits = Number(pm?.count || (pm?.papers?.length || 0));
        raw.pubmed = pm;
        highlights.push(`PubMed: hits ${hits}`);
      } catch (e) {
        raw.pubmed = { error: e.message };
        highlights.push("PubMed: error fetching.");
      }
    }

    // PubChem
    if (use.has("pubchem")) {
      try {
        const pc = await live.fetchPubChem(prompt);
        const cids = pc?.cids?.length || 0;
        raw.pubchem = pc;
        highlights.push(`PubChem CIDs resolved: ${cids}`);
      } catch (e) {
        raw.pubchem = { error: e.message };
        highlights.push("PubChem: error fetching.");
      }
    }

    // OpenAlex
    if (use.has("openalex")) {
      try {
        const oa = await live.fetchOpenAlex(prompt);
        const works = oa?.meta?.count || oa?.results?.length || 0;
        raw.openalex = oa;
        highlights.push(`OpenAlex works: ${works}`);
      } catch (e) {
        raw.openalex = { error: e.message };
        highlights.push("OpenAlex: error fetching.");
      }
    }

    // Patent (placeholder)
    if (use.has("patent")) {
      try {
        const pa = await live.fetchUSPatents(prompt);
        raw.patent = pa;
        if (pa.note) highlights.push("Patent data: " + pa.note);
      } catch (e) {
        raw.patent = { error: e.message };
        highlights.push("Patent: error fetching.");
      }
    }

    const summary = {
      title: `Live scan for: ${prompt}`,
      prompt,
      agents,
      highlights,
      raw
    };

    const q = await Query.create({
      user: req.user.id,
      prompt,
      agents,
      summary,
      pdfPath: ""
    });

    // Build a PDF
    let pdfPath = "";
    try {
      pdfPath = await generatePDFSummary(summary, q._id);
      q.pdfPath = pdfPath;
      await q.save();
    } catch (e) {
      console.warn("PDF generation failed:", e.message);
    }

    res.json({ ok: true, summary, pdfPath });
  } catch (err) {
    console.error("Run error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.history = async (req, res) => {
  try {
    const items = await Query.find({ user: req.user.id })
      .select("_id prompt pdfPath createdAt")
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ items });
  } catch (err) {
    console.error("History error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
