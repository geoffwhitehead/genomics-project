console.log('loading genomes');

var fs = require('fs'),
    path = require('path'),
    Genome = require('../models/genome'),
    mongoose = require('mongoose'),
    db = 'mongodb://localhost/GenomeProject',
    readLine = require('readline'),
    stream = require('stream'),
    outstream = new stream(),
    instream = fs.createReadStream(path.join(__dirname, '../../../sample_anno-2000000.txt')),
    rl = readLine.createInterface(instream, outstream);

mongoose.connect(db, function(err)
{
    if (err) console.log('1: ' + err);
});

Genome.remove(
{}, function(err, data)
{
    console.log(err);
});
var i = 0;

rl.on('line', function(line) // read in a line
    {
        i++;
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
                    return console.log('4 saving: ' + err);
                }
                else
                {
                    console.log(i + ': saved');
                }
            });
    });

rl.on('close', function()
{
    console.log('\nRefreshed index;');
    process.exit();
});
