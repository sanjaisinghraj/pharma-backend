// backend/controllers/queryController.js
const Query = require("../models/Query");
const {
  fetchClinicalTrials,
  fetchPubMed,
  fetchPubChem,
  fetchOpenAlex,
  fetchUSPatents
} = require("../utils/liveConnectors");
const { generatePDFSummary } = require("../utils/reportGenerator");

/**
 * Normalize agent list (checkbox values come as strings)
 */
function normalizeAgents(arr = []) {
  return (arr || []).map(a => String(a).toLowerCase());
}

exports.run = async (req, res) => {
  try {
    const prompt = (req.body?.prompt || "").trim();
    let agents = normalizeAgents(req.body?.agents);

    if (!prompt) return res.status(400).json({ error: "Prompt is required" });
    if (!agents.length) {
      // default – run the “big 5”
      agents = ["clinical", "patent", "pubmed", "pubchem", "openalex"];
    }

    // Build tasks based on selected agents
    const tasks = {};
    if (agents.includes("clinical")) tasks.clinical = fetchClinicalTrials(prompt);
    if (agents.includes("pubmed"))  tasks.pubmed  = fetchPubMed(prompt);
    if (agents.includes("pubchem")) tasks.pubchem = fetchPubChem(prompt);
    if (agents.includes("openalex"))tasks.openalex= fetchOpenAlex(prompt);
    if (agents.includes("patent"))  tasks.patent  = fetchUSPatents(prompt); // placeholder note inside

    // Run all selected connectors in parallel
    const results = {};
    const entries  = Object.entries(tasks);
    await Promise.all(
      entries.map(async ([key, p]) => {
        try {
          results[key] = await p;
        } catch (e) {
          results[key] = { error: e?.message || String(e) };
        }
      })
    );

    // Build a concise summary + highlights (you can tune this)
    const highlights = [];

    // ClinicalTrials.gov v2 returns a study count inside the payload (structure can vary)
    if (results.clinical) {
      const count = results.clinical?.totalCount || results.clinical?.studies?.length || 0;
      highlights.push(`Clinical trials found: ${count}`);
    }

    // PubMed: we returned {count, papers: xmlObject} – just show the count
    if (results.pubmed) {
      const count = results.pubmed?.count || 0;
      highlights.push(`PubMed hits: ${count}`);
    }

    // PubChem: we returned {cids: [...], description: ...}
    if (results.pubchem) {
      const n = Array.isArray(results.pubchem?.cids) ? results.pubchem.cids.length : 0;
      highlights.push(`PubChem CIDs resolved: ${n}`);
    }

    // OpenAlex: show the number of works returned
    if (results.openalex) {
      const n =
        (Array.isArray(results.openalex?.results) && results.openalex.results.length) ||
        results.openalex?.meta?.count || 0;
      highlights.push(`OpenAlex works: ${n}`);
    }

    if (results.patent) {
      highlights.push(`Patent data: ${results.patent.note || "Retrieved"}`);
    }

    const summary = {
      title: `Live scan for: ${prompt}`,
      prompt,
      agents,
      highlights,
      raw: results
    };

    // Save in DB
    const saved = await Query.create({
      user: req.user.id,
      prompt,
      agents,
      summary
    });

    // OPTIONAL: generate PDF (comment out if you don't want a PDF each time)
    let pdfPath = "";
    try {
      pdfPath = await generatePDFSummary(summary, saved._id);
      saved.pdfPath = pdfPath;
      await saved.save();
    } catch (e) {
      // PDF generation failure shouldn't fail the whole request
      console.warn("PDF generation failed:", e.message || e);
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
      .limit(50);
    res.json({ items });
  } catch (err) {
    console.error("History error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
