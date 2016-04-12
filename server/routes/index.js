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

    // define keys to enable iterating over metadata
    const KEYS_AGE = [ '0-10', '11-20', '21-30', '31-40', '41-50', '51-60', '61-80', '>80' ];
    const KEYS_BMI = [ 'underweight', 'normal', 'overweight', 'obese' ];
    const KEYS_GENDER = [ 'male', 'female' ];
    const KEYS_IBD = [ 'yes', 'no' ];

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



    // ************************************************************

    // REF GRAPH 1: Cohort Distribution: finds the matching cog id and creates a nodes for each of the people in the cohort.
    // The nodes are sized relatively to how often this COG occured in the sample from that person

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
                // create the categories and respective nodes
                data = addNodeCategory(true, data, 'cohort', 'Cohort', GRP_PPL, result.cog_id, 'Distribution over cohort', result.sampled_from, REF_1_SCALE );

            }
            if ( err ) res.send( err );
            else res.send( data );

        } );
    } );

    // ************************************************************

    // REF GRAPH 2: shows the metadata for this cog reference by creating nodes for each of
    // the categories. Each of the categories contain attached nodes that have sizes that are
    // relative to the occurence of this COG in the dataset within that category.

    router.get( '/api/data/graph/ref/2/:_cog', function( req, res ) {
        var data = [];

        console.log( 'getting metadata graph with cog: ' + cog_query );

        Cog.findOne( {
            "cog_id": new RegExp( req.params._cog )
        }, function( err, result ) {
            //console.log('RES'+result);
            if ( result ) {
                // calculate category node sizes for this graph
                var cat_node_size = resolveCategoryNodeSize( REF_2_SCALE );

                // create query root node
                data.push( createNode( result.cog_id, cat_node_size, cat_node_size, QUERY_NODE, result.cog_id, CAT_NODE ) );

                data = addNodeCategoryFromKeys( false, data, 'age', 'Age', GRP_AGE, result.cog_id, 'Distribution over age', KEYS_AGE, result.metadata.age, null, REF_2_SCALE );
                data = addNodeCategoryFromKeys( false, data, 'gender', 'Gender', GRP_GENDER, result.cog_id, 'Distribution over gender', KEYS_GENDER, result.metadata.gender, null, REF_2_SCALE );
                data = addNodeCategoryFromKeys( false, data, 'bmi', 'BMI', GRP_BMI, result.cog_id, 'Distribution over BMI', KEYS_BMI, result.metadata.bmi, null, REF_2_SCALE );
                data = addNodeCategoryFromKeys( false, data, 'ibd', 'IBD', GRP_IBD, result.cog_id, 'Distribution over IDB', KEYS_IBD, result.metadata.ibd, null, REF_2_SCALE );
            }
            if ( err ) res.send( err );
            else res.send( data );
        } );
    } );

    // ************************************************************

    // REF GRAPH 3: shows the metadata for this cog but the node sizing takes into considertation
    // the weighting of each of the categories

    router.get( '/api/data/graph/ref/3/:_cog', function( req, res ) {
        var data = [];
        console.log( 'getting metadata graph with cog: ' + req.params._cog );

        // pull the reference document from the database that contains the group weightings
        Ref.findOne( {}, function( err, ref ) {
            // find a cog matching the what the user searched for
            Cog.findOne( {
                "cog_id": new RegExp( req.params._cog )
            }, function( err, result ) {
                //console.log('RES'+result);
                if ( result ) {

                    var cat_node_size = resolveCategoryNodeSize(REF_3_SCALE);
                    // create query root node
                    data.push( createNode( result.cog_id, cat_node_size, cat_node_size, QUERY_NODE, result.cog_id, CAT_NODE ) );

                    // add the categories
                    data = addNodeCategoryFromKeys( true, data, 'age', 'Age', GRP_AGE, result.cog_id, 'Distribution over age', KEYS_AGE, result.metadata.age, ref.age, REF_3_SCALE );
                    data = addNodeCategoryFromKeys( true, data, 'gender', 'Gender', GRP_GENDER, result.cog_id, 'Distribution over gender', KEYS_GENDER, result.metadata.gender, ref.gender, REF_3_SCALE );
                    data = addNodeCategoryFromKeys( true, data, 'bmi', 'BMI', GRP_BMI, result.cog_id, 'Distribution over BMI', KEYS_BMI, result.metadata.bmi, ref.bmi, REF_3_SCALE );
                    data = addNodeCategoryFromKeys( true, data, 'ibd', 'IBD', GRP_IBD, result.cog_id, 'Distribution over IDB', KEYS_IBD, result.metadata.ibd, ref.ibd, REF_3_SCALE );

                }
                if ( err ) res.send( err );
                else res.send( data );
            } );
        } );
    } );

    // ************************************************************

    // Sequence search graph: This graph will perform a BLAST search with the users query against the database
    // and return a collection of nodes containing all the hits. It also returns an array of the matching genomes to
    // add to the scope; and also a table of the BLAST search results

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
                                            if ( err ) console.log( err );
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

    // ************************************************************

    // Sequence Search: Expand: This graph will perform a weighted metadata query on the COG that
    // the user selected when they pressed the search button. It will return a collection of nodes representing
    // all the metadat on that node and then attach those nodes to the selected node.

    router.get( '/api/data/graph/seq/expand/:_id', function( req, res ) {

        var data = {};
        var data_nodes = [];
        var root_id = req.params._id;

        // find the gene that user clicked on to expand
        Genome.findOne( {
            "_id": root_id
        }, function( err, gene ) {
            if ( err ) res.send( err );

            if ( !gene ) {
                res.send( {
                    "response": "err",
                    "data": "no gene found"
                } );
                return 1;
            }

            // find a the entry for this genes COG
            Cog.findOne( {
                "cog_id": gene.cog_ref
            }, function( err, result ) {
                if ( err ) res.send( err );

                data_nodes = addNodeCategory(true, data_nodes, 'cohort', 'Cohort', GRP_PPL, root_id, 'Distribution over cohort', result.sampled_from, SEQ_BLAST_SCALE );

                // pull the reference table which contains the weightings
                Ref.findOne( {}, function( err, ref ) {
                    if ( err ) res.send( err );

                    // define keys to enable iterating over metadata
                    var KEYS_AGE = [ '0-10', '11-20', '21-30', '31-40', '41-50', '51-60', '61-80', '>80' ];
                    var KEYS_BMI = [ 'underweight', 'normal', 'overweight', 'obese' ];
                    var KEYS_GENDER = [ 'male', 'female' ];
                    var KEYS_IBD = [ 'yes', 'no' ];

                    data_nodes = addNodeCategoryFromKeys( true, data_nodes, 'age', 'Age', GRP_AGE, root_id, 'Distribution over age', KEYS_AGE, result.metadata.age, ref.age, SEQ_BLAST_SCALE )
                    data_nodes = addNodeCategoryFromKeys( true, data_nodes, 'gender', 'Gender', GRP_GENDER, root_id, 'Distribution over gender', KEYS_GENDER, result.metadata.gender, ref.gender, SEQ_BLAST_SCALE );
                    data_nodes = addNodeCategoryFromKeys( true, data_nodes, 'bmi', 'BMI', GRP_BMI, root_id, 'Distribution over BMI', KEYS_BMI, result.metadata.bmi, ref.bmi, SEQ_BLAST_SCALE );
                    data_nodes = addNodeCategoryFromKeys( true, data_nodes, 'ibd', 'IBD', GRP_IBD, root_id, 'Distribution over IBD', KEYS_IBD, result.metadata.ibd, ref.ibd, SEQ_BLAST_SCALE );

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



    function getNodeUnitFromKeys( is_weighted, key_array, metadata_array, ref_array ) {
        var arr = [];

        for ( var key in key_array ) {
            var count;

            is_weighted ?
                count = metadata_array[ key_array[ key ] ].count * ref_array[ key_array[ key ] ].weight.toFixed( 2 )
                : count = metadata_array[ key_array[ key ] ].count;

            arr.push( {
                "count": count
            } );
        }

        return getUnitScale( arr );
    }

    function addNodeCategory(has_id, node_array, category, cat_label, group, edge_source, edge_label, metadata_array, scale ){
        var cat_node_size = resolveCategoryNodeSize(scale);
        var node_unit = getUnitScale(metadata_array);

        // create category node and edge
        node_array.push( createNode( 'n_'+category, cat_node_size, cat_node_size, CAT_NODE, cat_label, group ));
        node_array.push( createEdge( 'e_'+category, edge_source, 'n_'+category, edge_label, EDGE_WIDTH, EDGE_OPACITY, CAT_NODE ) );

        for ( var i = 0; i < metadata_array.length; i++ ) {
            var count = metadata_array[ i ].count
            var node_size = resolveSize( count, node_unit, scale );
            var name;
            // if using other properties create a case for then here and add into function params
            if (has_id) {
                name = metadata_array[ i ].id;
            } else {
                name = i; // default
            }

            node_array.push( createNode( 'n_' + name, node_size, node_size, group, name ) );
            node_array.push( createEdge( 'e_' + name, 'n_'+ category, 'n_' + name, 'Occurrences: ' + count, EDGE_WIDTH, EDGE_OPACITY, group ) );
        }

        return node_array;

    }

    function addNodeCategoryFromKeys( is_weighted, node_array, category, cat_label, group, edge_source, edge_label, key_array, metadata_array, ref_array, scale ) {

        var node_unit = getNodeUnitFromKeys( is_weighted, key_array, metadata_array, ref_array );
        var cat_node_size = resolveCategoryNodeSize(scale);

        node_array.push( createNode( 'n_' + category, cat_node_size, cat_node_size, CAT_NODE, cat_label, group ) );
        node_array.push( createEdge( 'e_' + category, edge_source, 'n_' + category, edge_label, EDGE_WIDTH, EDGE_OPACITY, CAT_NODE ) );


        for ( var key in key_array ) {
            var current_key = key_array[ key ];
            var score;
            if ( is_weighted ) {
                score = ( metadata_array[ current_key ].count * ref_array[ current_key ].weight ).toFixed( 2 );
            }
            else {
                score = metadata_array[ key_array[ key ] ].count;
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

    function findPersonIndex( array, person_id ) {
        for ( var i = 0; i < array.length; i++ ) {
            if ( array[ i ].id == person_id ) {
                return i;
            }
        }
    }

    function getUnitScale( array ) {
        console.log('ARRAYYYYYY: ' + array);
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
