(function()
{
    'use strict';
    var express = require('express');
    var path = require('path');
    var router = express.Router();
    var mongoose = require('mongoose');
    var Genome = require('../models/genome.js');
    var Person = require('../models/person.js');
    var bodyParser = require('body-parser');
    var _ = require('underscore');
    var db = 'mongodb://localhost/GenomeProject';

    mongoose.connect(db, function(err)
    {
        if (err) console.log(err);
    });

    router.use(bodyParser.urlencoded(
    {
        extended: true
    }));
    router.use(bodyParser.json());

    // requires for the file reader

    var fs = require('fs');

    /* GET home page. */
    router.get('/', function(req, res)
    {
        res.render('index');
    });



    //GENE SEARCH
    //TODO will need to change this to access database of cogs rather than the actual gene set
    router.get('/api/data/genes/:_searchString', function(req, res)
    {
        console.log('sending some data');

        Genome.find(
        {
            "cog_ref": new RegExp(req.params._searchString)
        }, function(err, data)
        {
            console.log('searched: ' + req.params._searchString + "-- returned: " + data);
            if (err) res.send(err);
            else res.send(data);
        }).limit(5);
    });

    // ******* REF GRAPH 1 *******
    router.get('/api/data/graph/ref/1/:_cog', function(req, res)
    {
        var data = [];
        var cog_query = req.params._cog;
        console.log('getting ref graph with cog: ' + cog_query);

        Genome.find(
        {
            "cog_ref": new RegExp(req.params._cog)
        }, function(err, results)
        {

            data.push(
            { // insert a new node
                group: "nodes",
                data:
                {
                    id: cog_query,
                },
                position:
                {
                    x: 100,
                    y: 100
                },
            });
            console.log(cog_query);
            for (var i = 0; i < results.length; i++)
            {
                data.push(
                { // insert a new node
                    group: "nodes",
                    data:
                    {
                        id: results[i].code,
                    },
                    position:
                    {
                        x: 100,
                        y: 100
                    },
                });
                // insert an edge for the new node
                data.push(
                {
                    data:
                    {
                        id: cog_query + "-" + results[i].code,
                        source: cog_query,
                        target: results[i].code
                    }
                });
            }
            console.log("RESULT: " + data);
            if (err) res.send(err);
            else res.send(data);

        });

    });

    // gets some test nodes for graph setup
    router.get('/api/data/nodes', function(req, res)
    {
        console.log('sending some data');
        var data = [];

        data.push(
        { // node a
            group: "nodes",
            data:
            {
                id: 'a'
            },
            position:
            {
                x: 100,
                y: 200
            },
        });
        res.send(data);
    });

    // ******* REF GRAPH 2 *******

    router.get('/api/data/graph/ref/2/:_cog', function(req, res)
    {
        var data = [];
        var cog_query = req.params._cog;
        console.log('getting graph 2 with  with cog: ' + cog_query);

        var people = {};
        var temp = '';
        Person.find(
        {}, function(err, results)
        {
            if (err) res.send(err);
            for (var i = 0; i < results.length; i++)
            {
                // added this line to filter out all the results that are UNMAPPED, V1, or O2.
                if ((results[i].id != 'unmapped') || (results[i].id != 'V1') || (results[i].id != 'O2'))
                {
                    people[results[i].id] = 0;
                }
            }
            // add the groups
            // people['unmapped'] = 0;
            // people['V1'] = 0;
            // people['O2'] = 0;
            //console.log("RESULT: " + people);

            Genome.find(
            {
                "cog_ref": new RegExp(cog_query)
            }, function(err, results)
            {

                if (err) res.send(err);
                //console.log('SIZE: '+results.length );
                //console.log('QUERY'+cog_query);
                for (var i = 0; i < results.length; i++)
                {
                    console.log("count" + people[results[i].person_id]);
                    people[results[i].person_id]++;
                }

                data.push(
                { // insert a new node
                    group: "nodes",
                    data:
                    {
                        id: cog_query,
                    },
                    style:
                    {
                        width: 50,
                        height: 50,
                        'background-color': '#666',
                    }
                });

                for (var p in people)
                {
                    console.log(p + " : " + people[p]);
                    data.push(
                    { // insert a new node
                        group: "nodes",
                        data:
                        {
                            id: p,
                        },
                        style:
                        {
                            width: people[p],
                            height: people[p]
                        }
                    });

                }
                console.log(data);
                //res.send(people);
                res.send(data);
            });
        });
    });

    // ******* REF GRAPH 3 *******

    router.get('/api/data/graph/ref/3/:_cog', function(req, res)
    {
        var data = [];
        var cog_query = req.params._cog;
        console.log('getting graph 3 with  with cog: ' + cog_query);

        var meta = {
            age:
            [{
                "0-10": 0,
                "11-20": 0,
                "21-30": 0,
                "31-40": 0,
                "41-50": 0,
                "51-60": 0,
                ">60": 0,
            }],
            gender:
            [{
                "male": 0,
                "female": 0,
            }],
            bmi:
            [{
                "underweight": 0,
                "normal": 0,
                "overweight": 0,
                "obese": 0
            }],
            ibd:
            [{
                "yes": 0,
                "no": 0,
            }],
            nationality:
            [{
                "denmark": 0,
                "spain": 0,
            }]
        };


        var temp = '';
        var people = {};

        Person.find(
        {}, function(err, results)
        {
            if (err) res.send(err);
            console.log("LENGTH: " + results.length);
            for (var i = 0; i < results.length; i++)
            {
                people[results[i].id] = results[i];
            }
            console.log("RESULT: " + people.length);
            console.log("RESULT: " + people);

            Genome.find(
            {
                "cog_ref": new RegExp(cog_query)
            }, function(err, results)
            {
                if (err) res.send(err);
                //console.log('SIZE: '+results.length );
                //console.log('QUERY'+cog_query);
                for (var i = 0; i < results.length; i++)
                {
                    // added this line to filter out all the results that are UNMAPPED, V1, or O2.
                    if ((results[i].person_id != 'unmapped') && (results[i].person_id != 'V1') && (results[i].person_id != 'O2'))
                    {
                        // adjust all the metadata for this person here!!!!!!
                        var person = people[results[i].person_id];
                        //console.log("PERSON: "+person);
                        //AGE
                        if (person['age'] <= 10)
                        {
                            meta.age['0-10']++
                        }
                        else if (person.age <= 20)
                        {
                            meta.age['11-20']++
                        }
                        else if (person.age <= 30)
                        {
                            meta.age['21-30']++
                        }
                        else if (person.age <= 40)
                        {
                            meta.age['31-40']++
                        }
                        else if (person.age <= 50)
                        {
                            meta.age['41-50']++
                        }
                        else if (person.age <= 60)
                        {
                            meta.age['51-60']++
                        }
                        else
                        {
                            meta.age['>60']++
                        };

                        //gender
                        if (person['gender'] == 'male')
                        {
                            meta.gender['male']++
                        }
                        else
                        {
                            meta.gender['female']++
                        }
                        //bmi
                        if (person['bmi'] < 18.25)
                        {
                            meta.bmi['underweight']++
                        }
                        else if (person['bmi'] <= 25)
                        {
                            meta.bmi['normal']++
                        }
                        else if (person['bmi'] <= 30)
                        {
                            meta.bmi['overweight']++
                        }
                        else
                        {
                            meta.bmi['obese']++
                        }

                        //ibd
                        if (person['ibd'] == 'yes')
                        {
                            meta.ibd['yes']++
                        }
                        else
                        {
                            meta.ibd['no']++
                        }
                        //nationality
                        if (person['nationality'] == 'spain')
                        {
                            meta.nationality['spain']++
                        }
                        else
                        {
                            meta.nationality['denmark']++
                        }
                    }
                }

                // create all the nodes based on the data

                // BASE NODE
                data.push(
                { // insert a new node
                    group: "nodes",
                    data:
                    {
                        id: cog_query,
                    },
                    style:
                    {
                        width: 20,
                        height: 20,
                        'background-color': '#666',
                    }
                });

                // CATEGORY NODES
                for (var cat in meta)
                {
                    data.push(
                    {
                        group: "properties",
                        data:
                        {
                            id: cat,
                        },
                        style:
                        {
                            width: 5,
                            height: 5,
                            'background-color': '#666',
                        }
                    },
                    {
                        data:
                        {
                            id: cog_query + "-" + cat,
                            source: cog_query,
                            target: cat
                        }
                    });
                    console.log("CATEGORY: "+cat);
                    //PROPERTY NODES
                    for (var property in cat)
                    {
                        if (cat.hasOwnProperty(property)) {
                            console.log("PROPERTY: "+ property);
                            data.push(
                            { // insert a new node
                                group: "nodes",
                                data:
                                {
                                    id: property,
                                },
                                style:
                                {
                                    width: cat[property],
                                    height: cat[property]
                                }

                            });
                        }

                    }
                }
                console.log(data);
                res.send(data);
            });
        });
    });


    // gets some test nodes for graph setup
    router.get('/api/data/nodes', function(req, res)
    {
        console.log('sending some data');
        var data = [];

        data.push(
        { // node a
            group: "nodes",
            data:
            {
                id: 'a'
            },
            position:
            {
                x: 100,
                y: 200
            }
        });
        res.send(data);
    });



    // router.get('/api/data/test', function(req, res)
    // {
    //     console.log('sending some test');
    //     var data = "test";
    // });

    // router.get('/api/data/studies', function(req, res)
    // {
    //     console.log('sending some data');
    //     var data = [
    //     {
    //         id: 1,
    //         name: "some study here",
    //         info: "some info about the study here",
    //         size: "100",
    //
    //     },
    //     {
    //         id: 2,
    //         name: "another study here",
    //         info: "some info about the study here",
    //         size: "50",
    //     }];
    //     res.status(200).json(data);
    // });

    // router.get('/api/data/studies/:_studyId/genes', function(req, res)
    // {
    //     console.log('sending some data');
    //
    //     Genome.find(
    //     {}, function(err, data)
    //     {
    //         if (err) res.send(err);
    //         else res.send(data);
    //     });
    // });

    // router.get('/api/data/studies/:_studyId/genes/:_geneId', function(req, res)
    // {
    //     console.log('sending some data');
    //
    //     Genome.findOne(
    //         req.params._geneId,
    //         function(err, data)
    //         {
    //             if (err) res.send(err);
    //             else res.send(data);
    //         });
    // });

    // router.post('/api/data/studies/:_studyId/genes', function(req, res)
    // {
    //     console.log('posting some data');
    //     var gene = new Genome(req.body);
    //     gene.save(function(err, data)
    //     {
    //         if (err) res.send(err);
    //         else res.json(
    //         {
    //             message: 'success',
    //             data: data
    //         });
    //     });
    // });

    // router.delete('/api/data/studies/:_studyId/genes', function(req, res)
    // {
    //     console.log('deleting some data');
    //     gene.remove(function(err, data)
    //     {
    //         if (err) res.send(err);
    //         else res.json(
    //         {
    //             message: 'success',
    //             data: data
    //         });
    //     });
    // });

    // router.get('/api/data/studies/:_studyId/genes/:_geneId/relationships', function(req, res)
    // {
    //     console.log('sending some data');
    //     var data = [
    //     {
    //         name: "occurence in elderly",
    //         description: "bla bla  bla",
    //     },
    //     {
    //         name: "occurence in healthy vs unhealthy individuals",
    //         description: "bla bla  bla",
    //     },
    //     {
    //         name: "placement in phylogenetic tree of life",
    //         description: "bla bla  bla",
    //     }];
    //     res.status(200).json(data);
    // });



    // router.get('/api/data/read', function(req, res)
    // {
    //     console.log('reading some data');
    //     var fs = require('fs');
    //     fs.readFile(path.join(__dirname, '../data/test.txt'), function(err, data)
    //     {
    //         if (err) console.log(err);
    //         // if (data) console.log(data);
    //         var array = data.toString().split("\n");
    //         array.forEach(function(i)
    //         {
    //             console.log(i + ".");
    //         });
    //         res.send(data);
    //     });
    // });


    /*

      router.get('/api/genes/:_id', function(req, res) {
        db.genes.get({
          _id: mongojs.ObjectId(req.params._id)
        }, '', function(err, data) {
          res.json(data);∫
        });

      });
    */
    module.exports = router;

}());
