// backend/controllers/queryController.js
const Query = require("../models/Query");
const {
  fetchClinicalTrials,
  fetchPubMed,
  fetchPubChem,
  fetchOpenAlex,
  fetchUSPatents,
} = require("../utils/liveConnectors");
const { generatePDFSummary } = require("../utils/reportGenerator");

exports.run = async (req, res) => {
  try {
    const { prompt, agents = [] } = req.body || {};
    if (!prompt) return res.status(400).json({ error: "Prompt is required" });

    // ---- live connectors (best-effort; each wrapped) -----------------
    const want = (k) => agents.includes(k);

    const raw = {};
    const highlights = [];

    // Clinical
    if (want("clinical")) {
      try {
        const ct = await fetchClinicalTrials(prompt, 1);
        raw.clinical = ct;
        const n =
          (ct?.studies?.length) ||
          (ct?.meta?.found) ||
          (ct?.meta?.count) ||
          0;
        highlights.push(`Clinical trials found: ${n}`);
      } catch (e) {
        raw.clinical = { error: e.message || String(e) };
        highlights.push("Clinical: error fetching.");
      }
    }

    // PubMed
    if (want("pubmed")) {
      try {
        const pm = await fetchPubMed(prompt);
        raw.pubmed = pm;
        const n = (pm?.papers && pm.papers.length) || pm?.count || 0;
        highlights.push(`PubMed hits: ${n}`);
      } catch (e) {
        raw.pubmed = { error: e.message || String(e) };
        highlights.push("PubMed: error fetching.");
      }
    }

    // PubChem
    if (want("pubchem")) {
      try {
        const pc = await fetchPubChem(prompt);
        raw.pubchem = pc;
        const n = (pc?.cids && pc.cids.length) || 0;
        highlights.push(`PubChem CIDs resolved: ${n}`);
      } catch (e) {
        raw.pubchem = { error: e.message || String(e) };
        highlights.push("PubChem: error fetching.");
      }
    }

    // OpenAlex
    if (want("openalex")) {
      try {
        const oa = await fetchOpenAlex(prompt);
        raw.openalex = oa;
        const n = oa?.meta?.count || (oa?.results?.length ?? 0);
        highlights.push(`OpenAlex works: ${n}`);
      } catch (e) {
        raw.openalex = { error: e.message || String(e) };
        highlights.push("OpenAlex: error fetching.");
      }
    }

    // Patent (placeholder)
    if (want("patent")) {
      try {
        const pt = await fetchUSPatents(prompt);
        raw.patent = pt;
        if (pt.note) highlights.push(`Patent data: ${pt.note}`);
      } catch (e) {
        raw.patent = { error: e.message || String(e) };
        highlights.push("Patents: error fetching.");
      }
    }

    const summary = {
      title: `Live scan for: ${prompt}`,
      prompt,
      agents,
      highlights,
      raw,
    };

    // Save query
    const q = await Query.create({
      user: req.user.id,
      prompt,
      agents,
      summary,
      pdfPath: "",
    });

    // Generate PDF and update record
    let pdfPath = "";
    try {
      pdfPath = await generatePDFSummary(summary, q._id.toString());
      q.pdfPath = pdfPath;
      await q.save();
    } catch (e) {
      // PDF errors should not break the response
      pdfPath = "";
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
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    // Keep it light for the list
    const trimmed = items.map((x) => ({
      _id: x._id,
      prompt: x.prompt,
      createdAt: x.createdAt,
      highlights: x.summary?.highlights || [],
      pdfPath: x.pdfPath || "",
    }));

    res.json({ items: trimmed });
  } catch (err) {
    console.error("History error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
