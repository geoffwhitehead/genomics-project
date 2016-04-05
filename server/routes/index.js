( function() {
    'use strict';
    var express = require( 'express' );
    var path = require( 'path' );
    var router = express.Router();
    var mongoose = require( 'mongoose' );
    var Genome = require( '../models/genome.js' );
    var Person = require( '../models/person.js' );
    var Cog = require( '../models/cog.js' );
    var Ref = require( '../models/ref.js' );
    var bodyParser = require( 'body-parser' );
    var _ = require( 'underscore' );
    var db = 'mongodb://localhost/gene_project';




    const NODE_SIZE = 10;
    const MAX_NODE_SIZE = 100;
    const MIN_NODE_SIZE = 1;

    const SCALING_FACTOR = 0.5;
    const PERSON_SCALING_FAC = 0.1;
    const GREEN = '#00FF00';
    const RED = '#FF0000';
    const BLUE = '#0000FF';
    const LBLUE = '#00FFFF';
    const BLACK = '#000000';
    const GREY = '#808080';
    const YELLOW = '#FFFF00';
    const WHITE = '#FFFFFF';

    const CAT_NODE = GREY;
    const GRP_AGE = RED;
    const GRP_GENDER = BLUE;
    const GRP_BMI = YELLOW;
    const GRP_IBD = LBLUE;
    const GRP_PPL = GREEN;

    mongoose.connect( db, function( err ) {
        if ( err ) console.log( err );
    } );

    router.use( bodyParser.urlencoded( {
        extended: true
    } ) );
    router.use( bodyParser.json() );

    // requires for the file reader

    var fs = require( 'fs' );

    /* GET home page. */
    router.get( '/', function( req, res ) {
        res.render( 'index' );
    } );

    //COG SEARCH
    router.get( '/api/data/genes/:_searchString', function( req, res ) {
        console.log( 'sending some data' );

        Cog.find( {
            "cog_id": new RegExp( req.params._searchString )
        }, function( err, data ) {
            console.log( 'searched: ' + req.params._searchString + "-- returned: " + data );
            if ( err ) res.send( err );
            else res.send( data );
        } ).limit( 10 );
    } );

    function findPersonIndex( array, person_id ) {
        for ( var i = 0; i < array.length; i++ ) {
            if ( array[ i ].id == person_id ) {
                return i;
            }
        }
    }

    // ******* REF GRAPH - Cohort Distribution *******
    router.get( '/api/data/graph/ref/1/:_cog', function( req, res ) {
        var data = [];
        var cog_query = req.params._cog;
        var count;
        var size;

        console.log( 'getting ref graph with cog: ' + cog_query );

        Cog.findOne( {
            "cog_id": new RegExp( req.params._cog )
        }, function( err, result ) {
            if ( result ) {

                data.push( createNode( cog_query, NODE_SIZE, NODE_SIZE, RED, cog_query ) );

                for ( var i = 0; i < result.sampled_from.length; i++ ) {
                    count = result.sampled_from[ i ].count;
                    size = resolveSize( count * PERSON_SCALING_FAC );

                    if ( size > 0 ) {
                        data.push( createNode( 'n_dist_' + result.sampled_from[ i ].id, size, size, GREEN, result.sampled_from[ i ].id ) );
                        data.push( createEdge( 'e_dist_' + result.sampled_from[ i ].id, cog_query, 'n_dist_' + result.sampled_from[ i ].id, count + ' occurrences' ) );
                    }
                }
            }
            console.log( "RESULT: " + data );
            if ( err ) res.send( err );
            else res.send( data );

        } );
    } );

    // ******* REF GRAPH - metadata *******

    router.get( '/api/data/graph/ref/2/:_cog', function( req, res ) {
        var data = [];
        var cog_query = req.params._cog;
        const CAT_NODE = GREY;
        const GRP_AGE = RED;
        const GRP_GENDER = BLUE;
        const GRP_BMI = YELLOW;
        const GRP_IBD = LBLUE;
        var size;
        var count;
        var target;
        var keys;
        console.log( 'getting metadata graph with cog: ' + cog_query );

        Cog.findOne( {
            "cog_id": new RegExp( req.params._cog )
        }, function( err, result ) {
            //console.log('RES'+result);
            if ( result ) {
                data.push( createNode( cog_query, NODE_SIZE, NODE_SIZE, BLACK, cog_query ) );

                // create nodes for metadata.age

                data.push( createEdge( 'e_age', cog_query, 'n_age', 'Distribution over age' ) );
                data.push( createNode( 'n_age', NODE_SIZE, NODE_SIZE, CAT_NODE, 'Age' ) );
                keys = [ '0-10', '11-20', '21-30', '31-40', '41-50', '51-60', '61-80', '>80' ];
                for ( var key in keys ) {
                    target = result.metadata.age[ keys[ key ] ];
                    var age_range = keys[ key ];

                    count = target.count;
                    size = resolveSize( count );

                    if ( size > 0 ) {
                        data.push( createNode( 'n_age_' + age_range, size, size, GRP_AGE, age_range ) );
                        data.push( createEdge( 'e_age_' + age_range, 'n_age', 'n_age_' + age_range, 'count: ' + count ) );
                    }
                }

                // create nodes for metadata.gender
                data.push( createEdge( 'e_gender', cog_query, 'n_gender', 'Distribution over gender' ) );
                data.push( createNode( 'n_gender', NODE_SIZE, NODE_SIZE, CAT_NODE, 'Gender' ) );

                target = result.metadata.gender;
                //male
                count = target.male.count;
                size = resolveSize( count );

                data.push( createNode( 'n_gender_male', size, size, GRP_GENDER, 'Male' ) );
                data.push( createEdge( 'e_gender_male', 'n_gender', 'n_gender_male', 'count: ' + count ) );
                //female
                count = target.female.count;
                size = resolveSize( count );

                data.push( createNode( 'n_gender_female', size, size, GRP_GENDER, 'Female' ) );
                data.push( createEdge( 'e_gender_female', 'n_gender', 'n_gender_female', 'count: ' + count ) );

                // create nodes for BMI
                data.push( createEdge( 'e_bmi', cog_query, 'n_bmi', 'Distribution over BMI' ) );
                data.push( createNode( 'n_bmi', NODE_SIZE, NODE_SIZE, CAT_NODE, 'BMI' ) );
                var keys = [ 'underweight', 'normal', 'overweight', 'obese' ];
                for ( var key in keys ) {
                    target = result.metadata.bmi[ keys[ key ] ];
                    var bmi_range = keys[ key ];

                    count = target.count;
                    size = resolveSize( count );

                    //if ( size > 0 ) {
                    data.push( createNode( 'n_bmi_' + bmi_range, size, size, GRP_BMI, bmi_range ) );
                    data.push( createEdge( 'e_bmi_' + bmi_range, 'n_bmi', 'n_bmi_' + bmi_range, 'count: ' + count ) );
                    //}
                }

                //create nodes for ibd
                data.push( createEdge( 'e_ibd', cog_query, 'n_ibd', 'Distribution over IDB' ) );
                data.push( createNode( 'n_ibd', NODE_SIZE, NODE_SIZE, CAT_NODE, 'IBD' ) );

                target = result.metadata.ibd;
                //male
                count = target.yes.count;
                size = resolveSize( count );

                data.push( createNode( 'n_ibd_yes', size, size, GRP_IBD, 'Yes' ) );
                data.push( createEdge( 'e_ibd_yes', 'n_ibd', 'n_ibd_yes', 'count: ' + count ) );
                //female

                count = target.no.count;
                size = resolveSize( count );
                data.push( createNode( 'n_ibd_no', size, size, GRP_IBD, 'No' ) );
                data.push( createEdge( 'e_ibd_no', 'n_ibd', 'n_ibd_no', 'count: ' + count ) );
            }
            if ( err ) res.send( err );
            else res.send( data );
        } );
    } );



    // ******* REF GRAPH 3 - relative metadata using weightings *******
    // currently very similar to graph 2.
    // TODO: either keep as seperate function if more changes are to be made or
    // merge into single function for graph 2 and 3.
    router.get( '/api/data/graph/ref/3/:_cog', function( req, res ) {
        var data = [];
        var cog_query = req.params._cog;
        var size;
        var count;
        var reference_weight;

        console.log( 'getting metadata graph with cog: ' + cog_query );
        // pull the reference from the database that contains the group weightings


        Ref.findOne( {}, function( err, ref ) {

            Cog.findOne( {
                "cog_id": new RegExp( req.params._cog )
            }, function( err, result ) {

                if ( result ) {
                    data.push( createNode( cog_query, NODE_SIZE, NODE_SIZE, BLACK, cog_query ) );

                    // create nodes for metadata.age

                    data.push( createEdge( 'e_age', cog_query, 'n_age', 'Distribution over age' ) );
                    data.push( createNode( 'n_age', NODE_SIZE, NODE_SIZE, CAT_NODE, 'Age' ) );

                    // create the keys for the age ranges and iterate over them creating nodes and edges
                    var keys = [ '0-10', '11-20', '21-30', '31-40', '41-50', '51-60', '61-80', '>80' ];
                    for ( var key in keys ) {
                        var target = result.metadata.age[ keys[ key ] ];
                        var age_range = keys[ key ];


                        count = ( target.count * ref.age[ keys[ key ] ].weight ).toFixed( 2 );
                        size = resolveSize( count * SCALING_FACTOR );

                        if ( size > 0 ) {
                            data.push( createNode( 'n_age_' + age_range, size, size, GRP_AGE, age_range ) );
                            data.push( createEdge( 'e_age_' + age_range, 'n_age', 'n_age_' + age_range, 'Score: ' + count ) );
                        }
                    }

                    // create nodes for metadata.gender
                    data.push( createEdge( 'e_gender', cog_query, 'n_gender', 'Distribution over gender' ) );
                    data.push( createNode( 'n_gender', NODE_SIZE, NODE_SIZE, CAT_NODE, 'Gender' ) );

                    var target = result.metadata.gender;
                    //male

                    count = ( target.male.count * ref.gender.male.weight ).toFixed( 2 );
                    size = resolveSize( count * SCALING_FACTOR );

                    data.push( createNode( 'n_gender_male', size, size, GRP_GENDER, 'Male' ) );
                    data.push( createEdge( 'e_gender_male', 'n_gender', 'n_gender_male', 'Score: ' + count ) );


                    //female
                    count = ( target.female.count * ref.gender.female.weight ).toFixed( 2 );
                    size = resolveSize( count * SCALING_FACTOR );

                    data.push( createNode( 'n_gender_female', size, size, GRP_GENDER, 'Female' ) );
                    data.push( createEdge( 'e_gender_female', 'n_gender', 'n_gender_female', 'Score: ' + count ) );

                    // create nodes for BMI
                    data.push( createEdge( 'e_bmi', cog_query, 'n_bmi', 'Distribution over BMI' ) );
                    data.push( createNode( 'n_bmi', NODE_SIZE, NODE_SIZE, CAT_NODE, 'BMI' ) );
                    var keys = [ 'underweight', 'normal', 'overweight', 'obese' ];
                    for ( var key in keys ) {
                        var target = result.metadata.bmi[ keys[ key ] ];
                        var bmi_range = keys[ key ];

                        count = ( target.count * ref.bmi[ keys[ key ] ].weight ).toFixed( 2 );

                        size = resolveSize( count * SCALING_FACTOR );

                        //if ( size > 0 ) {
                        data.push( createNode( 'n_bmi_' + bmi_range, size, size, GRP_BMI, bmi_range ) );
                        data.push( createEdge( 'e_bmi_' + bmi_range, 'n_bmi', 'n_bmi_' + bmi_range, 'Score: ' + count ) );
                        //}
                    }

                    //create nodes for ibd
                    data.push( createEdge( 'e_ibd', cog_query, 'n_ibd', 'Distribution over IDB' ) );
                    data.push( createNode( 'n_ibd', NODE_SIZE, NODE_SIZE, CAT_NODE, 'IBD' ) );

                    var target = result.metadata.ibd;


                    //yes
                    count = ( target.yes.count * ref.ibd.yes.weight ).toFixed( 2 );
                    size = resolveSize( count * SCALING_FACTOR );

                    data.push( createNode( 'n_ibd_yes', size, size, GRP_IBD, 'Yes' ) );
                    data.push( createEdge( 'e_ibd_yes', 'n_ibd', 'n_ibd_yes', 'Score: ' + count ) );

                    // no
                    count = ( target.no.count * ref.ibd.no.weight ).toFixed( 2 );
                    size = resolveSize( count * SCALING_FACTOR );

                    data.push( createNode( 'n_ibd_no', size, size, GRP_IBD, 'No' ) );
                    data.push( createEdge( 'e_ibd_no', 'n_ibd', 'n_ibd_no', 'Score: ' + count ) );
                }
                if ( err ) res.send( err );
                else res.send( data );
            } );
        } );
    } );


    // SEQUENCE GRAPH
    router.get( '/api/data/graph/seq/:_sequence', function( req, res ) {

        var writePath = "/Users/geoffwhitehead/Google Drive/University/Dissertation/network_project/server/blast/query.fa";
        var resultPath = "/Users/geoffwhitehead/Google Drive/University/Dissertation/network_project/server/blast/results.out";

        //write query input to a file
        var fs = require( 'fs' );
        fs.writeFile( writePath, req.params._sequence, function( err ) {
            if ( err ) {
                return console.log( err );
            }
            console.log( 'query saved!' );

            // create a child process to handle performing a search

            var spawn = require( 'child_process' ).spawn;
            var _ = require( 'underscore' ); // for some utility goodness
            var workerProcess = spawn( 'sh', [ './server/scripts/blast_query.sh' ] );
            var d = "";

            workerProcess.stdout.on( 'data', function( data ) {
                console.log( 'stdout: ' + data );
            } );

            workerProcess.stderr.on( 'data', function( data ) {
                console.log( 'stderr: ' + data );
            } );

            workerProcess.on( 'close', function( code ) {
                fs.access( resultPath, fs.F_OK, function( err ) {
                    if ( !err ) {
                        console.log( 'file found!' );
                        var data = {};
                        var data_tabular = [];
                        var data_nodes = [];
                        var data_genomes = {};
                        var result_count = 0;
                        var processed_count = 0;

                        var readline = require( 'linebyline' ),
                            rl = readline( resultPath );

                        rl.on( 'line', function( line ) {
                                result_count++;
                                line = line.toString().replace( new RegExp( '_', 'g' ), ':' );
                                line = line.toString().replace( 'scaffold', '' );
                                line = line.toString().replace( ':', '\t' );
                                line = line.toString().replace( ':', '\t' );
                                line = line.toString().replace( ':', '\t' );
                                var fields = line.toString().split( '\t' );
                                //console.log(fields);
                                data_tabular.push( {
                                    'gene': fields[ 1 ],
                                    'person': fields[ 2 ],
                                    'scaffold': fields[ 3 ],
                                    'location': fields[ 4 ],
                                    '%identity': fields[ 5 ],
                                    'alignment-length': fields[ 6 ],
                                    'mismatches': fields[ 7 ],
                                    'gap-opens': fields[ 8 ],
                                    'query-start': fields[ 9 ],
                                    'query-end': fields[ 10 ],
                                    'sequence-start': fields[ 11 ],
                                    'sequence-end': fields[ 12 ],
                                    'e-value': fields[ 13 ],
                                    'bit-score': fields[ 14 ]

                                } );

                                var size = fields[ 5 ] / 5;
                                console.log( "gene: " + fields[ 1 ] );
                                console.log( "person: " + fields[ 2 ] );
                                console.log( "scaffold: " + fields[ 3 ] );
                                console.log( "loc: " + fields[ 4 ] );

                                Genome.findOne( {
                                        code: fields[ 1 ],
                                        person_id: fields[ 2 ],
                                        scaffold: fields[ 3 ],
                                        location: new RegExp( fields[ 4 ] + ":?-?\\+?", "i" ), // ignore the :+ or - at the end of locators
                                    },
                                    function( err, genome ) {
                                        if ( genome ) {
                                            if ( err ) {
                                                console.log( err );
                                            }
                                            var name = "COG Ref: " + genome.cog_ref + "\nKEGG Ref: " + genome.kegg_ref;
                                            data_nodes.push( createNode( genome._id, size, size, '#2d2d2d', name ) );
                                            data_nodes.push( createEdge( genome._id + ':edge', 'query', genome._id, Math.round( fields[ 5 ] * 10 ) / 10 + "% Match" ) );
                                            data_genomes[ genome._id ] = {
                                                genome
                                            };
                                        }
                                        else {
                                            console.log( 'ERROR: couldnt find a gene in the dataset, this shouldnt happen as the blast and find are performed on the same data' );
                                        }
                                        processed_count++;
                                        if ( processed_count == result_count ) {
                                            data_nodes.push( createNode( 'query', 5, 5, 'red', 'Root Query' ) ); // ROOT NODE
                                            data[ 'nodes' ] = data_nodes;
                                            data[ 'tabular' ] = data_tabular;
                                            data[ 'genomes' ] = data_genomes;
                                            res.send( data );
                                        }
                                    }
                                );
                            } )
                            .on( 'error', function( err ) {
                                console.log( "error: " + err );
                            } )
                            .on( 'close', function() {
                                console.log( 'finished reading in file' );
                            } );
                    }
                    else {
                        // TODO: handle returning errors to the client
                        console.log( "error fetching results: " + code );
                        return;
                    }
                } );
            } );
        } );
    } );

    // EXPAND SEQUENCE GRAPH
    router.get( '/api/data/graph/seq/expand/:_id', function( req, res ) {
        // find the genome with the id passed as a parameter
        var data = {};
        var data_nodes = [];
        var data_genomes = {};
        var search_id = req.params._id;


        Genome.findOne( {
            "_id": search_id
        }, function( err, gene ) {
            if ( err ) res.send( err );

            if ( gene ) {
                //console.log( gene );

                var processed = 0;
                var count;
                var size;
                var reference_weight;

                // check that this gene has a COG reference
                if ( gene.cog_ref == 'NA' ) {
                    console.log( 'NO COG REFERENCE' );
                    data_nodes.push( createNode( 'n_na_' + search_id, NODE_SIZE, NODE_SIZE, RED, 'No Cog Ref Attached\nSimilar Genes:\n' + gene.similar_scaffolds ) );
                    data_nodes.push( createEdge( 'e_na_' + search_id, search_id, 'n_na_' + search_id, "No Cog Reference" ) );
                    data[ 'nodes' ] = data_nodes;
                    console.log( 'sending  data ' + data );
                    res.send( data );
                }
                else {
                    // find a the entry for this genes COG
                    Cog.findOne( {
                        "cog_id": gene.cog_ref
                    }, function( err, result ) {
                        if ( err ) res.send( err );
                        //console.log( "RESULLLLLLTTTTT: " + result );
                        // for each of the people in the cohort, create a node and edge for them representetive of the genes occurence
                        for ( var i = 0; i < result.sampled_from.length; i++ ) {
                            var size = resolveSize( result.sampled_from[ i ].count * PERSON_SCALING_FAC );
                            data_nodes.push( createNode( "n_" + result.sampled_from[ i ].id, size, size, GRP_PPL, result.sampled_from[ i ].id ) );
                            data_nodes.push( createEdge( "e_" + result.sampled_from[ i ].id, search_id, "n_" + result.sampled_from[ i ].id, "Occurrences: " + result.sampled_from[ i ].count ) );
                        }

                        // pull the reference table which contains the weightings
                        Ref.findOne( {}, function( err, ref ) {
                            if ( err ) res.send( err );
                            // create nodes for metadata.age
                            data_nodes.push( createNode( 'n_age', NODE_SIZE, NODE_SIZE, CAT_NODE, 'Age' ) );

                            // create the keys for the age ranges and iterate over them creating nodes and edges
                            var keys = [ '0-10', '11-20', '21-30', '31-40', '41-50', '51-60', '61-80', '>80' ];
                            for ( var key in keys ) {
                                var target = result.metadata.age[ keys[ key ] ];
                                var age_range = keys[ key ];


                                count = ( target.count * ref.age[ keys[ key ] ].weight ).toFixed( 2 );
                                size = resolveSize( count * SCALING_FACTOR );

                                if ( size > 0 ) {
                                    data_nodes.push( createNode( 'n_age_' + age_range, size, size, GRP_AGE, age_range ) );
                                    data_nodes.push( createEdge( 'e_age_' + age_range, 'n_age', 'n_age_' + age_range, 'Score: ' + count ) );
                                }
                            }

                            // create nodes for metadata.gender
                            //data_nodes.push( createEdge( 'e_gender', cog_query, 'n_gender', 'Distribution over gender' ) );
                            data_nodes.push( createNode( 'n_gender', NODE_SIZE, NODE_SIZE, CAT_NODE, 'Gender' ) );

                            var target = result.metadata.gender;
                            //male

                            count = ( target.male.count * ref.gender.male.weight ).toFixed( 2 );
                            size = resolveSize( count * SCALING_FACTOR );

                            data_nodes.push( createNode( 'n_gender_male', size, size, GRP_GENDER, 'Male' ) );
                            data_nodes.push( createEdge( 'e_gender_male', 'n_gender', 'n_gender_male', 'Score: ' + count ) );


                            //female
                            count = ( target.female.count * ref.gender.female.weight ).toFixed( 2 );
                            size = resolveSize( count * SCALING_FACTOR );

                            data_nodes.push( createNode( 'n_gender_female', size, size, GRP_GENDER, 'Female' ) );
                            data_nodes.push( createEdge( 'e_gender_female', 'n_gender', 'n_gender_female', 'Score: ' + count ) );

                            // create nodes for BMI
                            //data_nodes.push( createEdge( 'e_bmi', cog_query, 'n_bmi', 'Distribution over BMI' ) );
                            data_nodes.push( createNode( 'n_bmi', NODE_SIZE, NODE_SIZE, CAT_NODE, 'BMI' ) );
                            var keys = [ 'underweight', 'normal', 'overweight', 'obese' ];
                            for ( var key in keys ) {
                                var target = result.metadata.bmi[ keys[ key ] ];
                                var bmi_range = keys[ key ];

                                count = ( target.count * ref.bmi[ keys[ key ] ].weight ).toFixed( 2 );

                                size = resolveSize( count * SCALING_FACTOR );

                                //if ( size > 0 ) {
                                data_nodes.push( createNode( 'n_bmi_' + bmi_range, size, size, GRP_BMI, bmi_range ) );
                                data_nodes.push( createEdge( 'e_bmi_' + bmi_range, 'n_bmi', 'n_bmi_' + bmi_range, 'Score: ' + count ) );
                                //}
                            }

                            //create nodes for ibd
                            //data_nodes.push( createEdge( 'e_ibd', cog_query, 'n_ibd', 'Distribution over IDB' ) );
                            data_nodes.push( createNode( 'n_ibd', NODE_SIZE, NODE_SIZE, CAT_NODE, 'IBD' ) );

                            var target = result.metadata.ibd;


                            //yes
                            count = ( target.yes.count * ref.ibd.yes.weight ).toFixed( 2 );
                            size = resolveSize( count * SCALING_FACTOR );

                            data_nodes.push( createNode( 'n_ibd_yes', size, size, GRP_IBD, 'Yes' ) );
                            data_nodes.push( createEdge( 'e_ibd_yes', 'n_ibd', 'n_ibd_yes', 'Score: ' + count ) );

                            // no
                            count = ( target.no.count * ref.ibd.no.weight ).toFixed( 2 );
                            size = resolveSize( count * SCALING_FACTOR );

                            data_nodes.push( createNode( 'n_ibd_no', size, size, GRP_IBD, 'No' ) );
                            data_nodes.push( createEdge( 'e_ibd_no', 'n_ibd', 'n_ibd_no', 'Score: ' + count ) );



                            data[ 'nodes' ] = data_nodes;
                            console.log( 'sending  data ' + data );
                            res.send( data );

                        } );
                    } );
                }
            }
            else {
                console.log( "error: not found" )
            }

        } );

    } );



    /*
    for ( var i = 0; i < root_genome[ 0 ].similar_scaffolds.length; i++ ) {
        // for each of the scaffolds that are similar to that gene find the gene that corresponds to it ... if it exists
        Genome.findOne( {
            'person_id': root_genome[ 0 ].similar_scaffolds[ i ].person_id,
            'scaffold': root_genome[ 0 ].similar_scaffolds[ i ].scaffold,
            'location': new RegExp( root_genome[ 0 ].similar_scaffolds[ i ].location + ".*", "i" ), // ignore the :+ or - at the end of locators

        }, function( err, genome ) {
            if ( err ) console.log( err );
            if ( genome ) {
                var name = "COG Ref: " + genome.cog_ref + "\nKEGG Ref: " + genome.kegg_ref;
                data_nodes.push( createNode( genome._id, 5, 5, '#2d2d2d', name ) );
                data_nodes.push( createEdge( genome._id + ':edge', search_id, genome._id, "similar" ) );
                data_genomes[ genome._id ] = {
                    genome
                };
                //console.log("data genomes!!!!!!!!!!!"+data_genomes);
                processed++;
                if ( processed == root_genome[ 0 ].similar_scaffolds.length ) {
                    data[ 'nodes' ] = data_nodes;
                    data[ 'genomes' ] = data_genomes;
                    res.send( data );
                }
            }
            else {
                console.log( 'NULL RESULT' );
                processed++;
                if ( processed == root_genome[ 0 ].similar_scaffolds.length ) {
                    if ( data_nodes.length == 0 && i == root_genome[ 0 ].similar_scaffolds.length ) {
                        data_nodes.push( createNode( search_id + 'nf', 5, 5, 'red', 'No Matches' ) );
                        data_nodes.push( createEdge( search_id + 'nf:edge', search_id, genome._id, "No similar scaffolds exist / No genes found for scaffolds" ) );
                    }
                    data[ 'nodes' ] = data_nodes;
                    data[ 'genomes' ] = data_genomes;
                    res.send( data );
                }
            }
        } );
    }
    */



    // gets some test nodes for graph setup
    router.get( '/api/data/nodes', function( req, res ) {
        console.log( 'sending some data' );
        var data = [];

        data.push( { // node a
            group: "nodes",
            data: {
                id: 'a'
            },
            position: {
                x: 100,
                y: 200
            }
        } );
        res.send( data );
    } );

    function createNode( node_id, width, height, colour, label ) {
        return {
            group: "nodes",
            data: {
                id: node_id,

            },
            style: {
                width: width,
                height: height,
                'background-color': colour,
                'label': label,
                'font-size': 10,
            },
            classes: 'outline multiline-manual'

        }
    }

    function createEdge( edge_id, source_node, target_node, label ) {
        return { // insert a new edge
            data: {
                id: edge_id,
                source: source_node,
                target: target_node,
            },
            style: {
                label: label,
                'font-size': 10,
            },
            classes: 'autorotate'
        }
    }

    // takes a int and clamps it between and min and a max, avoids common nodes from
    // becoming too large and stops low count nodes from becoming too small.
    function resolveSize( size ) {
        var new_size = size;
        if ( size > MAX_NODE_SIZE ) {
            new_size = MAX_NODE_SIZE;
        }
        if ( size < MIN_NODE_SIZE ) {
            new_size = MIN_NODE_SIZE;
        }
        return new_size;

    }

    function getAgeKey( age ) {
        key = '';
        if ( age < 11 ) {
            key = '0-10';
        }
        else if ( age < 21 ) {
            key = '11-20'
        }
        else if ( age < 31 ) {
            key = '21-30'
        }
        else if ( age < 41 ) {
            key = '31-40'
        }
        else if ( age < 51 ) {
            key = '41-50'
        }
        else if ( age < 61 ) {
            key = '51-60'
        }
        else if ( age < 81 ) {
            key = '61-80'
        }
        else if ( age > 80 ) {
            key = '>80'
        }
        return key;
    }

    function getBMI( bmi ) {
        key = '';
        if ( bmi < 18.5 ) {
            key = 'underweight';
        }
        else if ( bmi < 25 ) {
            key = 'normal';
        }
        else if ( bmi < 30 ) {
            key = 'overweight';
        }
        else {
            key = 'obese';
        }
        return key;
    }

    module.exports = router;

}() );
