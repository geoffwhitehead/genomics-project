console.log('inserting blast data');
var currentdate = new Date();
console.log('job started on: ' + currentdate)

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

var file_directory = "/Users/geoffwhitehead/data/network_project/blasts/"
var file = path.join(file_directory, process.argv[2]);
console.log(file);
var lr = new LineByLineReader(file);

var records_i = 0;
var records_j = 0;
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
        records_j++;
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
            {
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
                        location: new RegExp(fields[3] + ":?-?\\+?", "i"), // ignore the :+ or - at the end of locators
                    },
                    function(err, genome)
                    {
                        if (err) console.log('error finding: ' + err);
                        gene_id = genome; // pass to var with wider scope
                        if (genome != null)
                        {
                            gene_id = genome._id; // save the id for the next line
                        }
                        else
                        { //no match found
                            unfound++;
                        }
                        lr.resume();
                    }
                );
            }

            //<---------ODD LINE-------<<<

            else
            {
                if (gene_id) // gene was found in previous line
                {
                    var genome = Genome.findOne(
                        {
                            _id: gene_id,
                        },
                        function(err, genome)
                        {

                            if (err) console.log('error finding gene id: ' + err);
                            var data = [];
                            var array = line.toString().split('\t');
                            var processed = 0;
                            for (var i = 0; i < array.length; i++)
                            {
                                array[i] = array[i].toString().replace('scaffold', '');
                                var fields = array[i].toString().split('_');
                                data.push(
                                {
                                    scaffold: fields[0],
                                    location: fields[1],
                                    person_id: fields[2],
                                    blast_id: fields[3],

                                })
                            }
                            genome.similar_scaffolds = data;

                            genome.save(function(err, data) // SAVE
                                {
                                    if (err)
                                    {
                                        lr.emit('error', err, genome);
                                    }
                                    else
                                    {
                                        records_i++;
                                        if (records_j >= 100)
                                        {
                                            console.log(records_i + ': updated!');
                                            console.log(unfound + ': not found!');
                                            records_j = 0;
                                        }
                                    }
                                    lr.resume();
                                }
                            );

                        });
                }
                else
                {
                    lr.resume();
                    // do nothing as the gene in previous line couldnt be found
                }
            }
        }
    });
lr.on('end', function()
{
    console.log("done!")
    var currentdate = new Date();
    console.log('last job completed on: ' + currentdate)

    process.exit(0);
    //
    // }
})
