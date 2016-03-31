console.log('loading people');

var fs = require('fs'),
    path = require('path'),
    Person = require('../models/person'),
    mongoose = require('mongoose'),
    db = 'mongodb://localhost/gene_project';


mongoose.connect(db, function(err)
{
    if (err) console.log(err);
});

fs.readFile(path.join(__dirname, '../data/people.txt'), function(err, data)
{
    if (err) return console.log(err);

    Person.remove(
    {}, function(err)
    {
        if (err) return console.log(err);

        var rows = data.toString().split("\n");

        rows.forEach(function(row)
        {
            console.log(row);
            var fields = row.toString().split(",");
            var person = new Person();

            person.id = fields[0];
            person.country = fields[1];
            person.gender = fields[2];
            person.age = fields[3];
            person.bmi = fields[4];
            person.ibd = fields[5];
            person.save(function(err, data)
            {
                if (err) console.log(err);
            });
        });
    });

});
