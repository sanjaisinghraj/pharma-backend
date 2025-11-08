const Query = require('../models/Query');
const connectors = require('../utils/liveConnectors');
const reportGenerator = require('../utils/reportGenerator');

exports.runQuery = async (req,res)=>{
    try{
        const {prompt, agents} = req.body;
        const selected = agents && agents.length ? agents : ['clinical','patent','pubmed','pubchem','openalex'];
        const results = {};
        const promises = selected.map(async (a) => {
            if(a === 'clinical') return {clinical: await connectors.fetchClinicalTrials(prompt)};
            if(a === 'patent') return {patent: await connectors.fetchUSPatents(prompt)};
            if(a === 'pubmed') return {pubmed: await connectors.fetchPubMed(prompt)};
            if(a === 'pubchem') return {pubchem: await connectors.fetchPubChem(prompt)};
            if(a === 'openalex') return {openalex: await connectors.fetchOpenAlex(prompt)};
            return {};
        });
        const outs = await Promise.all(promises);
        outs.forEach(o => Object.assign(results, o));

        const summary = {
            title: 'Live summary for: ' + prompt,
            highlights: [
                `Clinical trials: ${results.clinical ? results.clinical.count : 'NA'}`,
                `PubMed matches: ${results.pubmed ? results.pubmed.count : 'NA'}`,
                `Patents: ${results.patent ? results.patent.count : 'NA'}`
            ],
            raw: results
        };
        const q = new Query({userId: req.user.id, prompt, selectedAgents: selected, resultSummary: summary});
        await q.save();
        const pdfPath = await reportGenerator.generatePDFSummary(summary, q._id.toString());
        return res.json({summary, pdfPath});
    }catch(err){
        console.error(err);
        return res.status(500).json({error: 'server error', details: err.message});
    }
};

exports.history = async (req,res)=>{
    try{
        const items = await Query.find({userId: req.user.id}).sort({createdAt:-1}).limit(50);
        return res.json({items});
    }catch(err){
        console.error(err);
        return res.status(500).json({error: 'server error'});
    }
};
