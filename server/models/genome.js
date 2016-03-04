var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var GenomeSchema = new Schema({
    code                    : { type: String, required: true },
    person_id               : { type: String, required: true },
    coverage                : { type: String, required: true },
    type                    : { type: String, required: true },
    scaffold                : { type: String, required: true },
    location                : { type: String, required: true },
    cog_ref                 : { type: String, required: true },
    kegg_ref                : { type: String, required: true },
    similar_scaffolds       :
    [{
        scaffold: String,
        location: String,
        person_id: String,
        blast_id: String
    }],
    taxonomy                : [String],
});
module.exports = mongoose.model('Genome', GenomeSchema);
