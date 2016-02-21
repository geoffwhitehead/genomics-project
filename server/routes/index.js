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

    //GET GRAPH (REFERENCE)
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
                        height:50,
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
            //console.log('PEOPLE SIZE: '+_.size(people));
            //console.log('PEOPLE LOG: '+people);


            // create the nodes to push back

            // insert an edge for the new node
            // data.push(
            // {
            //     data:
            //     {
            //         id: cog_query + "-" + results[i].code,
            //         source: cog_query,
            //         target: results[i].code
            //     }
            // })
            //console.log("RESULT: " + data);

        });



        // Genome.find(
        // {
        //     "cog_ref": new RegExp(req.params._cog)
        // }, function(err, results)
        // {
        //
        //     data.push(
        //     { // insert a new node
        //         group: "nodes",
        //         data:
        //         {
        //             id: cog_query,
        //         },
        //         position:
        //         {
        //             x: 100,
        //             y: 100
        //         },
        //     });
        //     console.log(cog_query);
        //
        //
        //
        //
        //
        //
        //
        //
        //     for (var i = 0; i < results.length; i++)
        //     {
        //         data.push(
        //         { // insert a new node
        //             group: "nodes",
        //             data:
        //             {
        //                 id: results[i].code,
        //             },
        //             position:
        //             {
        //                 x: 100,
        //                 y: 100
        //             },
        //         });
        //         // insert an edge for the new node
        //         data.push(
        //         {
        //             data:
        //             {
        //                 id: cog_query + "-" + results[i].code,
        //                 source: cog_query,
        //                 target: results[i].code
        //             }
        //         })
        //     }
        //     console.log("RESULT: " + data);
        //     if (err) res.send(err);
        //     else res.send(data);
        //
        // })

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
