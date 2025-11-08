const fetch = require('node-fetch');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 }); // cache 5 minutes

function sleep(ms){ return new Promise(res=>setTimeout(res, ms)); }

async function fetchWithBackoff(url, opts={}, tries=3){
  const key = url + JSON.stringify(opts || {});
  const cached = cache.get(key);
  if(cached) return cached;
  for(let i=0;i<tries;i++){
    try{
      const res = await fetch(url, opts);
      if(res.status === 429){
        const wait = (i+1)*1000;
        await sleep(wait);
        continue;
      }
      const data = await res.json();
      cache.set(key, data);
      return data;
    }catch(e){
      if(i === tries-1) throw e;
      await sleep((i+1)*500);
    }
  }
  throw new Error('Failed to fetch: ' + url);
}

// ClinicalTrials.gov v2 API
exports.fetchClinicalTrials = async (term, page=1) => {
  const q = encodeURIComponent(term);
  const url = `https://clinicaltrials.gov/api/v2/studies?searchExpression=${q}&page=${page}`;
  return await fetchWithBackoff(url);
};

// PubMed (NCBI E-utilities) - esearch + efetch summary
exports.fetchPubMed = async (term) => {
  const apiKey = process.env.NCBI_API_KEY ? `&api_key=${process.env.NCBI_API_KEY}` : '';
  const esearch = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(term)}&retmode=json&retmax=20${apiKey}`;
  const es = await fetchWithBackoff(esearch);
  const idlist = es.esearchresult ? es.esearchresult.idlist : [];
  const ret = {count: es.esearchresult ? es.esearchresult.count : 0, papers: []};
  if(idlist && idlist.length){
    const efetch = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${idlist.join(',')}&retmode=xml${apiKey}`;
    const xml = await fetchWithBackoff(efetch);
    ret.papers = xml;
  }
  return ret;
};

// PubChem PUG-REST example: resolve CIDs and get summary
exports.fetchPubChem = async (term) => {
  const name = encodeURIComponent(term);
  const cidUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${name}/cids/JSON`;
  const cids = await fetchWithBackoff(cidUrl);
  const out = {cids: cids && cids.IdentifierList ? cids.IdentifierList.CID : []};
  if(out.cids && out.cids.length){
    const cid = out.cids[0];
    const summaryUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/description/JSON`;
    const desc = await fetchWithBackoff(summaryUrl);
    out.description = desc;
  }
  return out;
};

// OpenAlex works - search works by title/abstract
exports.fetchOpenAlex = async (term) => {
  const url = `https://api.openalex.org/works?filter=title.search:${encodeURIComponent(term)}&per-page=10`;
  return await fetchWithBackoff(url);
};

// USPTO placeholder
exports.fetchUSPatents = async (term) => {
  return {note: 'Use USPTO Open Data bulk or EPO OPS for detailed patent data. This connector is a placeholder.'};
};
