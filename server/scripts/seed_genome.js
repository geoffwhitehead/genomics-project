console.log('loading genomes');

var fs = require('fs'),
    path = require('path'),
    Genome = require('../models/genome'),
    mongoose = require('mongoose'),
    LineByLineReader = require('line-by-line'),
    db = 'mongodb://localhost/gene_project';


var file = '/Users/geoffwhitehead/data/network_project/0-9//geneset_annotated_0-9.fa';
//var file = path.join(__dirname, '/Volumes/Portable/Metadata/');
var lr = new LineByLineReader(file);
mongoose.connect(db, function(err)
{
    if (err) console.log('1: ' + err);
});

// delete all genomes from database
Genome.remove(
{}, function(err, data)
{
    console.log(err);
});

var i = 0;
var j = 0;
var processed = 0;
var complete = false;

lr.on('error', function(err)
{
    console.log('ERROR: ' + err);
});

lr.on('line', function(line) // read in a line
    {
        //lr.pause();
        i++;
        j++;

        //corrections to make parsing string easier
        line = line.toString().replace('\t', '_'); // replace the tabs to make delimeter consistent in teh string
        line = line.toString().replace('\t', '_');
        line = line.toString().replace('Lack_', 'Lack-');
        line = line.toString().replace('both_', 'both-');
        line = line.toString().replace('locus=', '');
        line = line.toString().replace('scaffold', '');

        var fields = line.toString().split('_'); // split the string by underscore and assign to array
        var genome = new Genome(); // create new object

        // genomes fields
        genome.code = fields[0];
        genome.person_id = fields[1];
        genome.coverage = fields[2];
        genome.type = fields[3];
        genome.scaffold = fields[4];
        genome.location = fields[5];
        genome.cog_ref = fields[6];
        genome.kegg_ref = fields[7];

        genome.save(function(err, data) // SAVE
            {
                if (err)
                {
                    lr.emit('error', err, genome);
                }
                else
                {
                    processed++;
                    if (j >= 1000)
                    {
                        console.log(i + ': saved');
                        j = 0;
                    }
                }
                if (complete && processed == i){
                    console.log('\nfinished processing;');
                    process.exit();
                }
                //lr.resume();
            }
        );
    });

lr.on('end', function()
{
    console.log('\nfinished reading in file;');
    complete = true;
    //process.exit();
});
