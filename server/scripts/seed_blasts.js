console.log('inserting blast data');

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

var blastIndex = 0;
var blastArray = [];
var file = '/Volumes/Portable/Metadata/Blasted/MH0001xaa.blast.e-val0.01.filtered';
blastArray.push(file);
var lr = new LineByLineReader(blastArray[0]);

var i = 0;
var j = 0;
var linecount = 0;
var gene_id;
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
        linecount++;
        if (linecount == 1)
        {
            // Do nothing... first line in datasets empty.
            lr.resume();
        }
        else
        {
            //<---------EVEN LINE-------<<<
            if (linecount % 2 == 0)
            { //line is even
                console.log('EVEN LINE; ' + line);
                line = line.toString().replace(new RegExp('_', 'g'), ':');
                line = line.toString().replace(':', '_');
                line = line.toString().replace(':', '_');
                line = line.toString().replace(':', '_');
                line = line.toString().replace('scaffold', ''); // some of the files still contain this
                var fields = line.toString().split('_');

                var genome = Genome.findOne(
                    {
                        code: fields[0],
                        person_id: fields[1],
                        scaffold: fields[2],
                        location: new RegExp(fields[3]+":?-?\\+?", "i"), // this may be incorrect
                    },
                    function(err, genome)
                    {
                        if (err) console.log('error finding: ' + err);

                        gene_id = genome; // pass to var with wider scope
                        if (genome != null)
                        {
                            console.log('gene found with id: ' + gene_id);
                            gene_id = genome._id; // save the id for the next line
                        }
                        else
                        { //no match found
                            unfound++;
                            console.log('genes not found ...' + unfound);
                        }
                        lr.resume();
                    }
                );
            }

            //<---------ODD LINE-------<<<

            else
            {
                console.log('ODD LINE: ' + line);
                if (gene_id) // gene was found in previous line
                {
                    console.log(gene_id);
                    lr.resume();
                }
                else
                {
                    lr.resume();
                    // do nothing as the gene in previous line couldnt be found
                }
            }

        }


    });

/*lr.on('end', function()
{
    blastIndex++;
    console.log('end: blast array length: ' + blastArray.length + 'blastIndex: ' + blastIndex)
    if (blastIndex < blastArray.length)
    {
        //lr = new LineByLineReader(blastArray[blastIndex]);
        console.log("reading in next file: " + blastArray[blastIndex])
    }
    else
    {
        console.log("done!")
    }
})*/
