console.log('loading genomes metadata');

var fs = require('fs'),
    path = require('path'),
    Genome = require('../models/genome'),
    mongoose = require('mongoose'),
    db = 'mongodb://localhost/GenomeProject',
    readLine = require('readline'),
    stream = require('stream'),
    outstream = new stream(),
    instream = fs.createReadStream(path.join(__dirname, '../data/sample_tax.txt')),
    rl = readLine.createInterface(instream, outstream);

mongoose.connect(db, function(err)
{
    if (err) console.log('1: ' + err);
});



rl.on('line', function(err, line)
        {
            if (err) {return console.log('5: ' + err);} // log any errors

            line.trim(); // remove any white space
            line = line.toString().replace('\t', '_'); //replace tab chars with underscores to match rest of string
            var fields = line.toString().split('_'); //split string by underscore

            var meta = fields[6].toString().split(";"); //split the metadata field by ';'

            Genome.update(

                {
                    code: fields[0]
                },
                {
                    $pushAll:
                    {
                        metadata: meta
                    }
                }
            );

        });
