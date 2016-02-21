var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var GenomeSchema = new Schema({
    code           : { type: String, required: true },
    person_id      : { type: String, required: true },
    coverage       : { type: String, required: true },
    type           : { type: String, required: true },
    build          : { type: String, required: true },
    alignment      : { type: String, required: true },
    kegg_ref       : { type: String, required: true },
    cog_ref        : { type: String, required: true },
    species        : [{ type: String }],
    metadata       : [{ type: String }]
});

module.exports = mongoose.model('Genome', GenomeSchema);
