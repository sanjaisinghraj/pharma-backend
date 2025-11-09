// backend/models/Query.js
const mongoose = require("mongoose");

const QuerySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    prompt: { type: String, required: true },
    agents: [{ type: String }],          // ['clinical','patent','pubmed','pubchem','openalex']
    summary: { type: Object, default: {} },
    pdfPath: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Query", QuerySchema);
