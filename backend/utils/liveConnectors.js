// backend/utils/liveConnectors.js
const fetch = require('node-fetch');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

function sleep(ms){ return new Promise(res=>setTimeout(res, ms)); }

async function fetchWithBackoff(url, opts={}, tries=3){
  const key = url + JSON.stringify(opts || {});
  const cached = cache.get(key);
  if(cached) return cached;

  for(let i=0;i<tries;i++){
    try{
      const res = await fetch(url, { ...opts, headers: { Accept: "application/json", ...(opts.headers||{}) } });
      const ct = res.headers.get("content-type") || "";
      const body = ct.includes("application/json") ? await res.json() : await res.text();
      // If text is returned but looks like JSON parseable, try parse
      let data = body;
      if (typeof body === "string") {
        try { data = JSON.parse(body); } catch(_) { /* leave as text */ }
      }
      cache.set(key, data);
      return data;
    }catch(e){
      if(i === tries-1) return { error: String(e) };
      await sleep((i+1)*700);
    }
  }
  return { error: "unreachable" };
}

// ClinicalTrials.gov v2 API
exports.fetchClinicalTrials = async (term, page=1) => {
  const q = encodeURIComponent(term);
  const url = `https://clinicaltrials.gov/api/v2/studies?searchExpression=${q}&page=${page}`;
  const data = await fetchWithBackoff(url);
  // Normalize to { count, items }
  if (data && data.studies && Array.isArray(data.studies)) {
    return { count: data.studies.length, items: data.studies };
  }
  if (data && data.totalStudies) {
    return { count: data.totalStudies, items: data.studies || [] };
  }
  return { count: 0, items: [], error: data && data.error ? data.error : null };
};

// PubMed (E-utilities)
exports.fetchPubMed = async (term) => {
  try{
    const apiKey = process.env.NCBI_API_KEY ? `&api_key=${process.env.NCBI_API_KEY}` : '';
    const esearch = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(term)}&retmode=json&retmax=20${apiKey}`;
    const es = await fetchWithBackoff(esearch);
    const idlist = es?.esearchresult?.idlist || [];
    return { count: Number(es?.esearchresult?.count || 0), ids: idlist };
  }catch(e){
    return { count: 0, ids: [], error: String(e) };
  }
};

// PubChem
exports.fetchPubChem = async (term) => {
  const name = encodeURIComponent(term);
  const cidUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${name}/cids/JSON`;
  const cids = await fetchWithBackoff(cidUrl);
  const out = { cids: cids?.IdentifierList?.CID || [] };
  return out;
};

// OpenAlex
exports.fetchOpenAlex = async (term) => {
  const url = `https://api.openalex.org/works?filter=title.search:${encodeURIComponent(term)}&per-page=10`;
  const data = await fetchWithBackoff(url);
  return data?.results ? { count: data.meta?.count || data.results.length, items: data.results } : { count: 0, items: [] };
};

// USPTO placeholder
exports.fetchUSPatents = async (_term) => {
  return { note: 'Use USPTO Open Data bulk or EPO OPS for detailed patent data. This connector is a placeholder.' };
};
