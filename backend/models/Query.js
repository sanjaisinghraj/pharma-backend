const mongoose = require('mongoose');

const QuerySchema = new mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    prompt: {type: String},
    selectedAgents: {type: [String]},
    resultSummary: {type: Object},
    createdAt: {type: Date, default: Date.now}
});

module.exports = mongoose.model('Query', QuerySchema);
