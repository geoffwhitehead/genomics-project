var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var CogSchema = new Schema({

    cog_id      :{ type: String, required: true },
    // each index is a person id and contains a count for the number of times
    // this cog appeared within that person
    sampled_from  : [{
        'id': { type: String },
        'count': { type: Number, default: 0},
    }],
    metadata :
    {
        age: {
            '0-10': {
                'count': {type:Number, default: 0 },
                'genomes': [],
            },
            '11-20': {
                'count': {type:Number, default: 0 },
                'genomes': [],
            },
            '21-30': {
                'count': {type:Number, default: 0 },
                'genomes': [],
            },
            '31-40': {
                'count': {type:Number, default: 0 },
                'genomes': [],
            },
            '41-50': {
                'count': {type:Number, default: 0 },
                'genomes': [],
            },
            '51-60': {
                'count': {type:Number, default: 0 },
                'genomes': [],
            },
            '61-80': {
                'count': {type:Number, default: 0 },
                'genomes': [],
            },
            '>80': {
                'count': {type:Number, default: 0 },
                'genomes': [],
            },
        },
        gender: {
            male: {
                'count': { type:Number, default: 0 },
                'genomes': [],
            },
            female: {
                'count': { type:Number, default: 0 },
                'genomes': [],
            },
        },
        bmi: {
            underweight: {
                'count': { type:Number, default: 0 },
                'genomes': [],
            },
            normal: {
                'count': { type:Number, default: 0 },
                'genomes': [],
            },
            overweight: {
                'count': { type:Number, default: 0 },
                'genomes': [],
            },
            obese: {
                'count': { type:Number, default: 0 },
                'genomes': [],
            },
        },
        ibd: {
            yes: {
                'count': { type:Number, default: 0 },
                'genomes': [],
            },
            no: {
                'count': { type:Number, default: 0 },
                'genomes': [],
            },
        },
    },
});
module.exports = mongoose.model('Cog', CogSchema);
