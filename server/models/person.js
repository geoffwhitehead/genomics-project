var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var PersonSchema = new Schema({
    name        : { type: String, required:true },
    country     : { type: String, required:true },
    gender      : { type: String, required:true },
    age         : { type: Number, required:true },
    bmi         : { type: Number, required:true },
    ibd         : { type: String, required:true }
});

module.exports = mongoose.model('Person', PersonSchema);
