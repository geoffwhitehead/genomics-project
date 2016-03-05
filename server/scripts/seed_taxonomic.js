console.log('appending taxonomic data');

var fs = require('fs'),
    path = require('path'),
    Genome = require('../models/genome'),
    mongoose = require('mongoose'),
    LineByLineReader = require('line-by-line'),
    db = 'mongodb://localhost/GenomeProject';

mongoose.connect(db, function(err)
{
    if (err) console.log('1: ' + err);
});

var file = '/Volumes/Portable/Metadata/0-9/geneset_taxonomy_0-9.fa';
var lr = new LineByLineReader(file);

var i = 0;
var j = 0;
var unfound = 0;
lr.on('error', function(err)
{
    console.log('ERROR: ' + err);
});

lr.on('line', function(line) // read in a line
    {
        lr.pause();
        i++;
        j++;

        //cor  rections to make parsing string easier
        line = line.toString().replace('\t', '_'); // replace the tabs to make delimeter consistent in teh string
        line = line.toString().replace('Lack_', 'Lack-');
        line = line.toString().replace('both_', 'both-');
        line = line.toString().replace('locus=', '');
        line = line.toString().replace('scaffold', '');

        var fields = line.toString().split('_'); // split the string by underscore and assign to array

        var genome = Genome.findOne(
            {
                code: fields[0],
                person_id: fields[1],
                coverage: fields[2],
                type: fields[3],
                scaffold: fields[4],
                location: fields[5],
            },
            function(err, genome)
            {
                if (genome != null)
                {
                    if (err) console.log('error finding: ' + err);
                    var tax = fields[6]
                    tax.trim();
                    tax = tax.toString().split(';');
                    genome.taxonomy = tax;

                    genome.save(function(err, data) // SAVE
                        {
                            if (err)
                            {
                                lr.emit('error', err, genome);
                            }
                            else
                            {
                                if (j >= 500)
                                {
                                    console.log(i + ': updated!');
                                    j = 0;
                                }
                            }
                            lr.resume();
                        }
                    );
                } else { //no match found -- occurs with sample datasets
                    unfound++;
                    console.log('lines not found ...' + unfound);
                    lr.resume();
                }
            }
        );
    });

    lr.on('end', function()
    {
        console.log('\nRefreshed index;');
        console.log('records not found: ' + unfound);
        process.exit();
    });
