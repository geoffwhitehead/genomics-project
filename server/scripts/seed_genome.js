console.log('loading genomes');
console.log('node --version');



var fs = require('fs'),
    path = require('path'),
    Genome = require('../models/genome'),
    mongoose = require('mongoose'),
    db = 'mongodb://localhost/GenomeProject',
    readLine = require('readline'),
    stream = require('stream'),
    outstream1 = new stream,
    outstream2 = new stream,
    instream1 = fs.createReadStream(path.join(__dirname, '../data/sample_anno.txt')),
    instream2 = fs.createReadStream(path.join(__dirname, '../data/sample_tax.txt')),
    rl1 = readLine.createInterface(instream1, outstream1),
    rl2 = readLine.createInterface(instream2, outstream2);

    mongoose.connect(db, function(err)
    {
        if (err) console.log('1: ' + err);
    });

rl1.on('line', function(line) // read in a line
    {
        console.log('line from file: ', line);
        line = line.toString().replace('\t', '_'); // replace the tabs to make delimeter consistent in teh string
        line = line.toString().replace('\t', '_');
        console.log(line);
        var fields = line.toString().split("_"); // split the string by underscore and assign to array
        var genome = new Genome(); // create new object
        // genomes fields
        genome.code = fields[0];
        genome.person_id = fields[1];
        genome.coverage = fields[2];
        genome.type = fields[3];
        genome.build = fields[4];
        genome.alignment = fields[5];
        genome.kegg_ref = fields[6];
        genome.cog_ref = fields[7];


        genome.save(function(err, data) // SAVE
            {
                if (err)
                {
                    return console.log('4 saving: ' + err)
                }
                else
                {
                    console.log('saved')
                };
            });
    });




rl2.on('line', function(err, line)
{
    console.log('line from file: ', line);
    if (err) return console.log('5: ' + err); // log any errors

    line.trim(); // remove any white space
    line = line.toString().replace('\t', '_'); //replace tab chars with underscores to match rest of string
    var fields = line.toString().split('_'); //split string by underscore

    var meta = fields[6].toString().split(";"); //split the metadata field by ';'

    Genome.update(
    {
        code: fields[0]
    },
    {
        metadata: meta
    }, function(err, data)
    {
        if (err) return console.log('3: ' + err + 'data:' + data);
    });

})


/*../../../../../../BGI_GeneSet20090523_taxonomic*/
// fs.readFile(path.join(__dirname, '../data/sample_tax.txt'), function(err, data)
// {
//     if (err) return console.log('5: ' + err); // log any errors
//     var rows = data.toString().split("\n"); // split the txt by new line
//     rows.splice(-1, 1); // remove the last element which is empty
//
//     rows.forEach(function(row)
//     {
//         row.trim(); // remove any white space
//         row = row.toString().replace('\t', '_'); //replace tab chars with underscores to match rest of string
//         var fields = row.toString().split('_'); //split string by underscore
//
//         var meta = fields[6].toString().split(";"); //split the metadata field by ';'
//
//         Genome.update(
//         {
//             code: fields[0]
//         },
//         {
//             metadata: meta
//         }, function(err, data)
//         {
//             if (err) return console.log('3: ' + err + 'data:' + data);
//         });
//     });

// });
