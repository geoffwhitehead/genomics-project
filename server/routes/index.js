(function()
{
    'use strict';
    var express = require('express');
    var path = require('path');
    var router = express.Router();
    var mongoose = require('mongoose');
    var Genome = require('../models/genome.js');
    var bodyParser = require('body-parser');
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

    router.get('/api/data/test', function(req, res)
    {
        console.log('sending some test');
        var data = "test";
    });

    router.get('/api/data/studies', function(req, res)
    {
        console.log('sending some data');
        var data = [
        {
            id: 1,
            name: "some study here",
            info: "some info about the study here",
            size: "100",

        },
        {
            id: 2,
            name: "another study here",
            info: "some info about the study here",
            size: "50",
        }];
        res.status(200).json(data);
    });

    router.get('/api/data/studies/:_studyId/genes', function(req, res)
    {
        console.log('sending some data');

        Genome.find(
        {}, function(err, data)
        {
            if (err) res.send(err);
            else res.send(data);
        });
    });

    router.get('/api/data/studies/:_studyId/genes/:_geneId', function(req, res)
    {
        console.log('sending some data');

        Genome.findOne(
            req.params._geneId,
            function(err, data)
            {
                if (err) res.send(err);
                else res.send(data);
            });
    });

    router.post('/api/data/studies/:_studyId/genes', function(req, res)
    {
        console.log('posting some data');
        var gene = new Genome(req.body);
        gene.save(function(err, data)
        {
            if (err) res.send(err);
            else res.json(
            {
                message: 'success',
                data: data
            });
        });
    });

    router.delete('/api/data/studies/:_studyId/genes', function(req, res)
    {
        console.log('deleting some data');
        gene.remove(function(err, data)
        {
            if (err) res.send(err);
            else res.json(
            {
                message: 'success',
                data: data
            });
        });
    });

    // var data = [
    // {
    //     id: 1,
    //     name: "m60",
    //     info: "some info about the gene here",
    //     family: "bacteria",
    //
    // },
    // {
    //     id: 2,
    //     name: "12345",
    //     info: "some info about the gene here",
    //     family: "archaea",
    // },
    // {
    //     id: 3,
    //     name: "something",
    //     info: "some info about the gene here",
    //     family: "Eucarya",
    // }];
    //res.status(200).json(data);


    router.get('/api/data/studies/:_studyId/genes/:_geneId/relationships', function(req, res)
    {
        console.log('sending some data');
        var data = [
        {
            name: "occurence in elderly",
            description: "bla bla  bla",
        },
        {
            name: "occurence in healthy vs unhealthy individuals",
            description: "bla bla  bla",
        },
        {
            name: "placement in phylogenetic tree of life",
            description: "bla bla  bla",
        }];
        res.status(200).json(data);
    });

    router.get('/api/data/nodes', function(req, res)
    {
        console.log('sending some data');
        var data = [

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
            },
            {
                //node b
                group: "nodes",
                data:
                {
                    id: 'b'
                },
                position:
                {
                    x: 200,
                    y: 100
                },
            },
            {
                //node c
                group: "nodes",
                data:
                {
                    id: 'c'
                },
                position:
                {
                    x: 100,
                    y: 100
                },
            },
            {
                //node d
                group: "nodes",
                data:
                {
                    id: 'd'
                },
                position:
                {
                    x: 20,
                    y: 400
                },
            },
            {
                //node e
                group: "nodes",
                data:
                {
                    id: 'e'
                },
                position:
                {
                    x: 500,
                    y: 400
                },
            },
            {
                //node f
                group: "nodes",
                data:
                {
                    id: 'f'
                },
                position:
                {
                    x: 800,
                    y: 50
                },
            },
            { //edge ab
                data:
                {
                    id: 'ab',
                    source: 'a',
                    target: 'b'
                }
            },
            { //edge ab
                data:
                {
                    id: 'cd',
                    source: 'c',
                    target: 'd'
                }
            },
            { //edge ab
                data:
                {
                    id: 'ef',
                    source: 'e',
                    target: 'f'
                }
            },
            { //edge ab
                data:
                {
                    id: 'fa',
                    source: 'f',
                    target: 'a'
                }
            },
        ];
        res.send(data);
    });

    router.get('/api/data/read', function(req, res)
    {
        console.log('reading some data');
        var fs = require('fs');
        fs.readFile(path.join(__dirname, '../data/test.txt'), function(err, data)
        {
            if (err) console.log(err);
            // if (data) console.log(data);
            var array = data.toString().split("\n");
            array.forEach(function(i)
            {
                console.log(i + ".");
            });
            res.send(data);
        });
    });


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
