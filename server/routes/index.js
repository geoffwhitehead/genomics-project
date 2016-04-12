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


    const END_OF_COHORT = 9; // temporary var as im not using the entire cohort

    const NODE_SIZE = 200;
    const MAX_NODE_SIZE = 500;
    const MIN_NODE_SIZE = 5;

    const REF_1_SCALE = 0.8;
    const REF_2_SCALE = 0.8;
    const REF_3_SCALE = 0.8;
    const SEQ_BLAST_SCALE = 1;
    const SEQ_EXPAND_SCALE = 1;
    const CAT_NODE_SCALE = 0.5;


    const SCALING_FACTOR = 1;
    const BLAST_SCALE_FACTOR = 1;
    const PERSON_SCALING_FAC = 1;
    const GREEN = '#00FF00';
    const RED = '#FF0000';
    const BLUE = '#0000FF';
    const CYAN = '#00FFFF';
    const BLACK = '#000000';
    const GREY = '#808080';
    const YELLOW = '#FFFF00';
    const WHITE = '#FFFFFF';
    const ORANGE = '#FFA500'
    const BROWN = '#664200'
    const PURPLE = '#800080'
    const PINK = '#ff6699'

    const CAT_NODE = GREY;
    const QUERY_NODE = BLACK;
    const GRP_BLAST = BLACK;
    const GRP_AGE = RED;
    const GRP_GENDER = YELLOW;
    const GRP_BMI = ORANGE;
    const GRP_IBD = CYAN;
    const GRP_PPL = GREEN;


    const EDGE_WIDTH = 3;
    const EDGE_OPACITY = 1;
    const EDGE_FONT_SIZE = 12;
    const NODE_FONT_SIZE = 12;
    const NODE_BORDER_WIDTH = 4;

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

    function getUnitScale( array ) {
        var max = array[ 0 ].count;

        for ( var i = 0; i < array.length; i++ ) {
            if ( array[ i ].count > max ) {
                max = array[ i ].count;
            }
        }
        return 100 / max;
    }

    // used to return a size that is scaled proportionally to all the nodes in the group
    function resolveSize( object_count, node_unit, graph_scale ) {
        var resolved_size = ( object_count * node_unit ) * graph_scale;
        if ( resolved_size < MIN_NODE_SIZE ) {
            resolved_size = MIN_NODE_SIZE;
        }
        return resolved_size
    }

    function resolveCategoryNodeSize( graph_scale ) {
        return ( CAT_NODE_SCALE * 100 ) * graph_scale;
    }

    // ******* REF GRAPH - Cohort Distribution *******
    router.get( '/api/data/graph/ref/1/:_cog', function( req, res ) {
        var data = [];
        var cog_query = req.params._cog;

        console.log( 'getting reference graph with cog: ' + cog_query );

        Cog.findOne( {
            "cog_id": new RegExp( req.params._cog )
        }, function( err, result ) {
            if ( result ) {

                // create the root query node
                var cat_node_size = resolveCategoryNodeSize( REF_1_SCALE )
                data.push( createNode( cog_query, cat_node_size, cat_node_size, QUERY_NODE, cog_query, GRP_PPL ) );

                // get the unit to scale the node sizes correctly
                var node_unit_cohort = getUnitScale( result.sampled_from );

                // create the nodes for all the people in the cohort
                for ( var i = 0; i < result.sampled_from.length; i++ ) {
                    var count = result.sampled_from[ i ].count;
                    var node_size = resolveSize( count, node_unit_cohort, REF_1_SCALE );
                    var current_id = result.sampled_from[ i ].id;

                    data.push( createNode( 'n_dist_' + current_id, node_size, node_size, GRP_PPL, current_id ) );
                    data.push( createEdge( 'e_dist_' + current_id, cog_query, 'n_dist_' + current_id, count + ' occurrences ' ) );
                }
            }
            if ( err ) res.send( err );
            else res.send( data );

        } );
    } );

    // ******* REF GRAPH - metadata ******* s

    router.get( '/api/data/graph/ref/2/:_cog', function( req, res ) {
        var data = [];
        var cog_query = req.params._cog;
        console.log( 'getting metadata graph with cog: ' + cog_query );

        Cog.findOne( {
            "cog_id": new RegExp( req.params._cog )
        }, function( err, result ) {
            //console.log('RES'+result);
            if ( result ) {
                // calculate category node sizes for this graph
                var cat_node_size = resolveCategoryNodeSize( REF_2_SCALE );

                // define keys to enable iterating over metadata
                var age_keys = [ '0-10', '11-20', '21-30', '31-40', '41-50', '51-60', '61-80', '>80' ];
                var bmi_keys = [ 'underweight', 'normal', 'overweight', 'obese' ];
                var gender_keys = [ 'male', 'female' ];
                var ibd_keys = [ 'yes', 'no' ];

                // ************************************************************

                // for each of the categories: work out the unit value for determining the size range of the nodes
                var arr = []; // reset
                // collect all the count values and insert into array
                for ( var key in age_keys ) {
                    arr.push( result.metadata.age[ age_keys[ key ] ] );
                }
                var node_unit_age = getUnitScale( arr );

                arr = []; // reset
                for ( var key in bmi_keys ) {
                    arr.push( result.metadata.bmi[ bmi_keys[ key ] ] );
                }
                var node_unit_bmi = getUnitScale( arr );

                arr = []; // reset
                for ( var key in gender_keys ) {
                    arr.push( result.metadata.gender[ gender_keys[ key ] ] );
                }
                var node_unit_gender = getUnitScale( arr );

                arr = []; // reset
                for ( var key in ibd_keys ) {
                    arr.push( result.metadata.ibd[ ibd_keys[ key ] ] );
                }
                var node_unit_ibd = getUnitScale( arr );

                // ************************************************************

                // create query root node
                data.push( createNode( cog_query, cat_node_size, cat_node_size, QUERY_NODE, cog_query, CAT_NODE ) );

                // create age category nodes
                data.push( createNode( 'n_age', cat_node_size, cat_node_size, CAT_NODE, 'Age', GRP_AGE ) );
                data.push( createEdge( 'e_age', cog_query, 'n_age', 'Distribution over age', EDGE_WIDTH, EDGE_OPACITY, CAT_NODE ) );

                for ( var key in age_keys ) {
                    var current_key = age_keys[ key ];
                    var count = result.metadata.age[ age_keys[ key ] ].count;
                    var node_size = resolveSize( count, node_unit_age, REF_2_SCALE );

                    // create age metadata nodes
                    data.push( createNode( 'n_age_' + current_key, node_size, node_size, GRP_AGE, current_key ) );
                    data.push( createEdge( 'e_age_' + current_key, 'n_age', 'n_age_' + current_key, 'count: ' + count, EDGE_WIDTH, EDGE_OPACITY, GRP_AGE ) );
                }

                // ************************************************************

                // create gender category nodes
                data.push( createNode( 'n_gender', cat_node_size, cat_node_size, CAT_NODE, 'Gender', GRP_GENDER ) );
                data.push( createEdge( 'e_gender', cog_query, 'n_gender', 'Distribution over gender', EDGE_WIDTH, EDGE_OPACITY, CAT_NODE ) );

                for ( var key in gender_keys ) {
                    var current_key = gender_keys[ key ];
                    var count = result.metadata.gender[ gender_keys[ key ] ].count;
                    var node_size = resolveSize( count, node_unit_gender, REF_2_SCALE );

                    // create gender metadata nodes
                    data.push( createNode( 'n_gender_' + current_key, node_size, node_size, GRP_GENDER, current_key ) );
                    data.push( createEdge( 'e_gender_' + current_key, 'n_gender', 'n_gender_' + current_key, 'count: ' + count, EDGE_WIDTH, EDGE_OPACITY, GRP_GENDER ) );
                }

                // ************************************************************

                // create BMI category nodes
                data.push( createNode( 'n_bmi', cat_node_size, cat_node_size, CAT_NODE, 'BMI', GRP_BMI ) );
                data.push( createEdge( 'e_bmi', cog_query, 'n_bmi', 'Distribution over BMI', EDGE_WIDTH, EDGE_OPACITY, CAT_NODE ) );

                for ( var key in bmi_keys ) {
                    var current_key = bmi_keys[ key ];
                    var count = result.metadata.bmi[ bmi_keys[ key ] ].count;
                    var node_size = resolveSize( count, node_unit_bmi, REF_2_SCALE );

                    // create bmi metadata nodes
                    data.push( createNode( 'n_bmi_' + current_key, node_size, node_size, GRP_BMI, current_key ) );
                    data.push( createEdge( 'e_bmi_' + current_key, 'n_bmi', 'n_bmi_' + current_key, 'count: ' + count, EDGE_WIDTH, EDGE_OPACITY, GRP_BMI ) );

                }

                // ************************************************************

                //create nodes for ibd
                data.push( createNode( 'n_ibd', cat_node_size, cat_node_size, CAT_NODE, 'IBD', GRP_IBD ) );
                data.push( createEdge( 'e_ibd', cog_query, 'n_ibd', 'Distribution over IDB', EDGE_WIDTH, EDGE_OPACITY, CAT_NODE ) );

                for ( var key in ibd_keys ) {
                    var current_key = ibd_keys[ key ];
                    var count = result.metadata.ibd[ ibd_keys[ key ] ].count;
                    var node_size = resolveSize( count, node_unit_ibd, REF_2_SCALE );

                    // create ibd metadata nodes
                    data.push( createNode( 'n_ibd_' + current_key, node_size, node_size, GRP_IBD, current_key ) );
                    data.push( createEdge( 'e_ibd_' + current_key, 'n_ibd', 'n_ibd_' + current_key, 'count: ' + count, EDGE_WIDTH, EDGE_OPACITY, GRP_IBD ) );

                }
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
                //console.log('RES'+result);
                if ( result ) {
                    // calculate category node sizes for this graph
                    var cat_node_size = resolveCategoryNodeSize( REF_2_SCALE );

                    // define keys to enable iterating over metadata
                    var age_keys = [ '0-10', '11-20', '21-30', '31-40', '41-50', '51-60', '61-80', '>80' ];
                    var bmi_keys = [ 'underweight', 'normal', 'overweight', 'obese' ];
                    var gender_keys = [ 'male', 'female' ];
                    var ibd_keys = [ 'yes', 'no' ];

                    // ************************************************************

                    // for each of the categories: work out the unit value for determining the size range of the nodes
                    var arr = []; // reset
                    // collect all the count values and insert into array
                    for ( var key in age_keys ) {
                        arr.push( {
                            "count": result.metadata.age[ age_keys[ key ] ].count * ref.age[ age_keys[ key ] ].weight.toFixed( 2 )
                        } );
                    }
                    var node_unit_age = getUnitScale( arr );

                    arr = []; // reset
                    for ( var key in bmi_keys ) {
                        arr.push( {
                            "count": result.metadata.bmi[ bmi_keys[ key ] ].count * ref.bmi[ bmi_keys[ key ] ].weight.toFixed( 2 )
                        } );
                    }
                    var node_unit_bmi = getUnitScale( arr );

                    arr = []; // reset
                    for ( var key in gender_keys ) {
                        arr.push( {
                            "count": result.metadata.gender[ gender_keys[ key ] ].count * ref.gender[ gender_keys[ key ] ].weight.toFixed( 2 )
                        } );
                    }
                    var node_unit_gender = getUnitScale( arr );

                    arr = []; // reset
                    for ( var key in ibd_keys ) {
                        arr.push( {
                            "count": result.metadata.ibd[ ibd_keys[ key ] ].count * ref.ibd[ ibd_keys[ key ] ].weight.toFixed( 2 )
                        } );
                    }
                    var node_unit_ibd = getUnitScale( arr );

                    // ************************************************************

                    // create query root node
                    data.push( createNode( cog_query, cat_node_size, cat_node_size, QUERY_NODE, cog_query, CAT_NODE ) );

                    // create age category nodes
                    data.push( createNode( 'n_age', cat_node_size, cat_node_size, CAT_NODE, 'Age', GRP_AGE ) );
                    data.push( createEdge( 'e_age', cog_query, 'n_age', 'Distribution over age', EDGE_WIDTH, EDGE_OPACITY, CAT_NODE ) );

                    for ( var key in age_keys ) {
                        var current_key = age_keys[ key ];
                        var score = ( result.metadata.age[ current_key ].count * ref.age[ current_key ].weight ).toFixed( 2 );
                        var node_size = resolveSize( score, node_unit_age, REF_3_SCALE );

                        // create age metadata nodes
                        data.push( createNode( 'n_age_' + current_key, node_size, node_size, GRP_AGE, current_key ) );
                        data.push( createEdge( 'e_age_' + current_key, 'n_age', 'n_age_' + current_key, 'Score: ' + score, EDGE_WIDTH, EDGE_OPACITY, GRP_AGE ) );
                    }
                    // ************************************************************

                    // create gender category nodes
                    data.push( createNode( 'n_gender', cat_node_size, cat_node_size, CAT_NODE, 'Gender', GRP_GENDER ) );
                    data.push( createEdge( 'e_gender', cog_query, 'n_gender', 'Distribution over gender', EDGE_WIDTH, EDGE_OPACITY, CAT_NODE ) );

                    for ( var key in gender_keys ) {
                        var current_key = gender_keys[ key ];
                        var score = ( result.metadata.gender[ current_key ].count * ref.gender[ current_key ].weight ).toFixed( 2 );
                        var node_size = resolveSize( score, node_unit_gender, REF_3_SCALE );

                        // create gender metadata nodes
                        data.push( createNode( 'n_gender_' + current_key, node_size, node_size, GRP_GENDER, current_key ) );
                        data.push( createEdge( 'e_gender_' + current_key, 'n_gender', 'n_gender_' + current_key, 'Score: ' + score, EDGE_WIDTH, EDGE_OPACITY, GRP_GENDER ) );
                    }

                    // ************************************************************

                    // create BMI category nodes
                    data.push( createNode( 'n_bmi', cat_node_size, cat_node_size, CAT_NODE, 'BMI', GRP_BMI ) );
                    data.push( createEdge( 'e_bmi', cog_query, 'n_bmi', 'Distribution over BMI', EDGE_WIDTH, EDGE_OPACITY, CAT_NODE ) );

                    for ( var key in bmi_keys ) {
                        var current_key = bmi_keys[ key ];
                        var score = ( result.metadata.bmi[ current_key ].count * ref.bmi[ current_key ].weight ).toFixed( 2 );
                        var node_size = resolveSize( score, node_unit_bmi, REF_3_SCALE );

                        // create bmi metadata nodes
                        data.push( createNode( 'n_bmi_' + current_key, node_size, node_size, GRP_BMI, current_key ) );
                        data.push( createEdge( 'e_bmi_' + current_key, 'n_bmi', 'n_bmi_' + current_key, 'Score: ' + score, EDGE_WIDTH, EDGE_OPACITY, GRP_BMI ) );

                    }

                    // ************************************************************

                    //create nodes for ibd
                    data.push( createNode( 'n_ibd', cat_node_size, cat_node_size, CAT_NODE, 'IBD', GRP_IBD ) );
                    data.push( createEdge( 'e_ibd', cog_query, 'n_ibd', 'Distribution over IDB', EDGE_WIDTH, EDGE_OPACITY, CAT_NODE ) );

                    for ( var key in ibd_keys ) {
                        var current_key = ibd_keys[ key ];
                        var score = ( result.metadata.ibd[ current_key ].count * ref.ibd[ current_key ].weight ).toFixed( 2 );
                        var node_size = resolveSize( score, node_unit_ibd, REF_3_SCALE );

                        // create ibd metadata nodes
                        data.push( createNode( 'n_ibd_' + current_key, node_size, node_size, GRP_IBD, current_key ) );
                        data.push( createEdge( 'e_ibd_' + current_key, 'n_ibd', 'n_ibd_' + current_key, 'Score: ' + score, EDGE_WIDTH, EDGE_OPACITY, GRP_IBD ) );

                    }
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

                                Genome.findOne( {
                                        code: fields[ 1 ],
                                        person_id: fields[ 2 ],
                                        scaffold: fields[ 3 ],
                                        location: new RegExp( fields[ 4 ] + ":?-?\\+?", "i" ), // ignore the :+ or - at the end of locators
                                    },
                                    function( err, gene ) {
                                        if ( gene ) {
                                            if ( err ) {
                                                console.log( err );
                                            }
                                            // check for multiple cogs
                                            var references = gene.cog_ref.toString().split( ';' );
                                            console.log( references );

                                            if ( references.length == 1 ) { // currently not handling multiple cog references
                                                if ( gene.cog_ref != "NA" ) { // currently not handling COG references that are NA, filter these out
                                                    var match = Math.round( fields[ 5 ] * 10 ) / 10 + "% Match";
                                                    var node_size = ( fields[ 5 ] ) * SEQ_BLAST_SCALE;
                                                    var name = "COG Ref: " + gene.cog_ref + "\n" + match;

                                                    data_nodes.push( createNode( gene._id, node_size, node_size, GRP_BLAST, name, CAT_NODE ) );
                                                    data_nodes.push( createEdge( gene._id + ':edge', 'root', gene._id, match, EDGE_WIDTH, EDGE_OPACITY, CAT_NODE ) );
                                                    data_genomes[ gene._id ] = {
                                                        gene
                                                    }
                                                };
                                            }
                                        }
                                        else {
                                            console.log( 'ERROR: couldnt find a gene in the dataset, this shouldnt happen as the blast and find are performed on the same data' );
                                        }
                                        processed_count++;
                                        if ( processed_count == result_count ) {
                                            var node_size = resolveCategoryNodeSize( SEQ_BLAST_SCALE );
                                            data_nodes.push( createNode( 'root', node_size, node_size, QUERY_NODE, 'Root' ) ); // ROOT NODE
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

            if ( !gene ) {
                res.send( {
                    "response": "err",
                    "data": "no gene found"
                } );
            }
            var processed = 0;
            var count;
            var size;
            var reference_weight;
            var cog_query = search_id;

            // find a the entry for this genes COG
            Cog.findOne( {
                "cog_id": gene.cog_ref
            }, function( err, result ) {
                if ( err ) res.send( err );

                // calculate category node sizes for this graph
                var cat_node_size = resolveCategoryNodeSize( SEQ_EXPAND_SCALE );

                // create category node and edge for cohort
                data_nodes.push( createNode( 'n_cohort', cat_node_size, cat_node_size, CAT_NODE, 'Cohort', GRP_PPL ) );
                data_nodes.push( createEdge( 'e_cohort', cog_query, 'n_cohort', 'Distribution over cohort', EDGE_WIDTH, EDGE_OPACITY, CAT_NODE ) );

                // create nodes for the cohort
                var node_unit_cohort = getUnitScale( result.sampled_from );

                for ( var i = 0; i < result.sampled_from.length; i++ ) {
                    var count = result.sampled_from[ i ].count
                    var node_size = resolveSize( count, node_unit_cohort, SEQ_EXPAND_SCALE );
                    var name = result.sampled_from[ i ].id;

                    data_nodes.push( createNode( "n_" + name, node_size, node_size, GRP_PPL, name ) );
                    data_nodes.push( createEdge( "e_" + name, "n_cohort", "n_" + name, "Occurrences: " + count, EDGE_WIDTH, EDGE_OPACITY, GRP_PPL ) );
                }

                // pull the reference table which contains the weightings
                Ref.findOne( {}, function( err, ref ) {
                    if ( err ) res.send( err );

                    // define keys to enable iterating over metadata
                    var age_keys = [ '0-10', '11-20', '21-30', '31-40', '41-50', '51-60', '61-80', '>80' ];
                    var bmi_keys = [ 'underweight', 'normal', 'overweight', 'obese' ];
                    var gender_keys = [ 'male', 'female' ];
                    var ibd_keys = [ 'yes', 'no' ];

                    data_nodes = addCategory( true, data_nodes, 'age', cat_node_size, 'Age', GRP_AGE, cog_query, 'Distribution over age', age_keys, result.metadata.age, ref.age, SEQ_BLAST_SCALE )
                    data_nodes = addCategory( true, data_nodes, 'gender', cat_node_size, 'Gender', GRP_GENDER, cog_query, 'Distribution over gender', gender_keys, result.metadata.gender, ref.gender, SEQ_BLAST_SCALE );
                    data_nodes = addCategory( true, data_nodes, 'bmi', cat_node_size, 'BMI', GRP_BMI, cog_query, 'Distribution over BMI', bmi_keys, result.metadata.bmi, ref.bmi, SEQ_BLAST_SCALE );
                    data_nodes = addCategory( true, data_nodes, 'ibd', cat_node_size, 'IBD', GRP_IBD, cog_query, 'Distribution over IBD', ibd_keys, result.metadata.ibd, ref.ibd, SEQ_BLAST_SCALE );

                    // create all the edges from each person to their respective metadata
                    Person.find( {}, function( err, people ) {

                        for ( var i = 0; i < END_OF_COHORT; i++ ) {

                            data_nodes.push( createEdge( 'e_' + people[ i ].id + '_age', 'n_' + people[ i ].id, 'n_age_' + getAgeKey( people[ i ].age ), '', EDGE_WIDTH, EDGE_OPACITY, GRP_AGE ) );
                            data_nodes.push( createEdge( 'e_' + people[ i ].id + '_bmi', 'n_' + people[ i ].id, 'n_bmi_' + getBMIKey( people[ i ].bmi ), '', EDGE_WIDTH, EDGE_OPACITY, GRP_BMI ) );
                            data_nodes.push( createEdge( 'e_' + people[ i ].id + '_gender', 'n_' + people[ i ].id, 'n_gender_' + getGenderKey( people[ i ].gender ), '', EDGE_WIDTH, EDGE_OPACITY, GRP_GENDER ) );
                            data_nodes.push( createEdge( 'e_' + people[ i ].id + '_ibd', 'n_' + people[ i ].id, 'n_ibd_' + getIBDKey( people[ i ].ibd ), '', EDGE_WIDTH, EDGE_OPACITY, GRP_IBD ) );

                        };

                        data[ 'nodes' ] = data_nodes;
                        console.log( 'sending  data ' + data );
                        res.send( data );

                    } ); // end of person find
                } ); // end of reference find
            } ); // end of cog find
        } ); // end of genome find
    } ); // end of router get

    function getNodeUnit( is_weighted, key_array, metadata_array, ref_array ) {
        var arr = [];
        for ( var key in key_array ) {
            var count;
            is_weighted ?
                count = metadata_array[ key_array[ key ] ].count * ref_array[ key_array[ key ] ].weight.toFixed( 2 )
                : count = metadata_array[ key_array[ key ] ];
            arr.push( {
                "count": count
            } );
        }
        return getUnitScale( arr );
    }

    function addCategory( is_weighted, node_array, category, cat_node_size, cat_label, group, edge_source, edge_label, key_array, metadata_array, ref_array, scale ) {

        var node_unit = getNodeUnit( true, key_array, metadata_array, ref_array );

        node_array.push( createNode( 'n_' + category, cat_node_size, cat_node_size, CAT_NODE, cat_label, group ) );
        node_array.push( createEdge( 'e_' + category, edge_source, 'n_' + category, edge_label, EDGE_WIDTH, EDGE_OPACITY, CAT_NODE ) );

        for ( var key in key_array ) {
            var current_key = key_array[ key ];
            var score;
            if ( is_weighted ) {
                score = ( metadata_array[ current_key ].count * ref_array[ current_key ].weight ).toFixed( 2 );
            }
            else {
                score = metadata_array[ key_array[ key ] ];
            }

            var node_size = resolveSize( score, node_unit, scale );
            var name = category + '_' + current_key;
            var label;

            is_weighted ? label = 'Score' : label = 'Count';

            node_array.push( createNode( 'n_' + name, node_size, node_size, group, current_key ) );
            node_array.push( createEdge( 'e_' + name, 'n_' + category, 'n_' + name, label + score, EDGE_WIDTH, EDGE_OPACITY, group ) );

        }

        return node_array;
    }

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

    function createNode( node_id, width, height, colour, label, border_colour ) {
        if ( typeof border_colour === 'undefined' ) {
            border_colour = colour
        }
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
                'font-size': NODE_FONT_SIZE,
                'border-width': NODE_BORDER_WIDTH,
                'border-color': border_colour
            },
            classes: 'outline multiline-manual'

        }
    }

    function createEdge( edge_id, source_node, target_node, label, width, opacity, colour ) {
        return { // insert a new edge
            data: {
                id: edge_id,
                source: source_node,
                target: target_node,
            },
            style: {
                label: label,
                'font-size': EDGE_FONT_SIZE,
                'width': width,
                'opacity': opacity,
                'line-color': colour,
                'target-arrow-color': colour,
            },

            classes: 'autorotate'
        }
    }



    function getAgeKey( age ) {
        var key;
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

    function getBMIKey( bmi ) {
        var key;
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

    function getIBDKey( ibd ) {
        var key;
        if ( ibd == 'N' ) {
            key = 'no'
        }
        else
        if ( ibd == 'Y' ) {
            key = 'yes'
        }
        return key;
    }

    function getGenderKey( gender ) {
        var key;
        if ( gender == 'male' ) {
            key = 'male';
        }
        else if ( gender == 'female' ) {
            key = 'female';
        }
        return key;
    }

    module.exports = router;

}() );
