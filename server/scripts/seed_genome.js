console.log('loading genomes');

var fs = require('fs'),
    path = require('path'),
    Genome = require('../models/genome'),
    mongoose = require('mongoose'),
    LineByLineReader = require('line-by-line'),
    db = 'mongodb://localhost/GenomeProject';
//readLine = require('readline'),
//stream = require('stream'),
//outstream = new stream(),
//instream = fs.createReadStream(),



var file = path.join(__dirname, '../../../sample_anno-2000000.txt');
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

lr.on('error', function(err)
{
    console.log('ERROR: ' + err);
});

lr.on('line', function(line) // read in a line
    {
        lr.pause();
        i++;
        j++;
        //console.log('line from file: ', line);
        line = line.toString().replace('\t', '_'); // replace the tabs to make delimeter consistent in teh string
        line = line.toString().replace('\t', '_');
        //console.log(line);
        var fields = line.toString().split("_"); // split the string by underscore and assign to array
        var genome = new Genome(); // create new object
        // genomes fields
        genome.code = fields[0];
        genome.person_id = fields[1];
        genome.coverage = fields[2];
        genome.type = fields[3];
        genome.build = fields[4];
        genome.alignment = fields[5];
        genome.cog_ref = fields[6];
        genome.kegg_ref = fields[7];
        genome.species = [];
        genome.metadata = [];

        genome.save(function(err, data) // SAVE
            {
                if (err)
                {
                    lt.emit('error', err, genome);
                }
                else
                {
                    if (j >= 1000){
                        console.log(i + ': saved');
                        j = 0;
                    }
                }
                lr.resume();
            });
    });

lr.on('close', function()
{
    console.log('\nRefreshed index;');
    process.exit();
});
