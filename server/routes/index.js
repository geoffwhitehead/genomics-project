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
    const COG_POLL_LIMIT = 5;
    const CAT_NODE_PERCENT_SIZE = 100;

    const NODE_SIZE = 300;
    //const MAX_NODE_SIZE = 700;
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
    const YELLOW = '#ffcc00';
    const WHITE = '#FFFFFF';
    const ORANGE = '#FFA500'
    const BROWN = '#664200'
    const PURPLE = '#666699'
    const PINK = '#ff6699'
    const TEAL = '#669999'
    const DARK_RED = '#990033'

    const CAT_NODE = GREY;
    const QUERY_NODE = BLACK;

    const GRP_BLAST = YELLOW;
    const GRP_AGE = TEAL;
    const GRP_GENDER = PURPLE;
    const GRP_BMI = ORANGE;
    const GRP_IBD = CYAN;
    const GRP_PPL = GREEN;
    const GRP_ROOT = YELLOW;

    const EDGE_WIDTH = 3;
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

    // gets some test nodes for graph setup
    router.get( '/api/data/nodes', function( req, res ) {
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

    // ************************************************************

    // COG search : as the user types into the search field the server is queried and
    // returns x COG references that match the users input.

    router.get( '/api/data/genes/:_searchString', function( req, res ) {

        Cog.find( {
            "cog_id": new RegExp( req.params._searchString )
        }, function( err, data ) {
            if ( err ) {
                res.send({"status" : "err", "message": "Error fetching results from database : " + err});
                return;
            }
            else res.send( data );
        } ).limit( COG_POLL_LIMIT );
    } );



    // ************************************************************

    // REF GRAPH 1: Cohort Distribution: finds the matching cog id and creates a nodes for each of the people in the cohort.
    // The nodes are sized relatively to how often this COG occured in the sample from that person

    router.get( '/api/data/graph/ref/1/:_cog', function( req, res ) {
        var data = [];
        var cog_query = req.params._cog;

        Cog.findOne( {
            "cog_id": new RegExp( req.params._cog )
        }, function( err, result ) {
            if ( result ) {

                // create the root query node
                var cat_node_size = resolveCategoryNodeSize( REF_1_SCALE )
                data.push( createNode( cog_query, cat_node_size, cat_node_size, QUERY_NODE, cog_query, GRP_PPL ) );
                // create the categories and respective nodes
                data = addNodeCategory(true, data, 'cohort', 'Cohort', GRP_PPL, result.cog_id, 'Distribution over cohort', result.sampled_from, REF_1_SCALE, false );

            }
            if ( err ) {
                res.send({"status" : "err", "message": "Error fetching results from database : " + err});
                return;
            }
            else res.send( data );

        } );
    } );

    // ************************************************************

    // REF GRAPH 2: shows the metadata for this cog reference by creating nodes for each of
    // the categories. Each of the categories contain attached nodes that have sizes that are
    // relative to the occurence of this COG in the dataset within that category.

    router.get( '/api/data/graph/ref/2/:_cog', function( req, res ) {
        var data = [];

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
            if ( err ) {
                res.send({"status" : "err", "message": "Error fetching results from database : " + err});
                return;
            }
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
                if ( err ) {
                    res.send({"status" : "err", "message": "Error fetching results from database : " + err});
                    return;
                }
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

                                            if ( references.length == 1 ) { // currently not handling multiple cog references
                                                //if ( gene.cog_ref != "NA" ) { // currently not handling COG references that are NA, filter these out
                                                    var match = Math.round( fields[ 5 ] * 10 ) / 10 + "% Match";
                                                    var node_size = ( fields[ 5 ] ) * SEQ_BLAST_SCALE;
                                                    var name = "Gene ID: " + gene.code + "\nCOG Ref: " + gene.cog_ref + "\n" + match;

                                                    data_nodes.push( createNode( gene._id, node_size, node_size, GRP_BLAST, name, CAT_NODE ) );
                                                    data_nodes.push( createEdge( gene._id + ':edge', 'root', gene._id, match, EDGE_WIDTH,  GRP_ROOT ) );
                                                    data_genomes[ gene._id ] = {
                                                        gene
                                                    }
                                                    //}
                                            }
                                        }
                                        else {
                                            console.log( 'ERROR: couldnt find a gene in the dataset, this shouldnt happen as the blast and find are performed on the same data' );
                                        }
                                        processed_count++;
                                        if ( processed_count == result_count ) {
                                            var node_size = resolveCategoryNodeSize( SEQ_BLAST_SCALE );
                                            data_nodes.push( createNode( 'root', node_size, node_size, QUERY_NODE, 'Root', GRP_ROOT ) ); // ROOT NODE
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
                        res.send({"status" : "err", "message": "Error fetching results from database : " + err});
                        return;

                    }
                } );
            } );
        } );
    } );

    // ************************************************************

    // Sequence Search: COG Expand: This graph will perform a weighted metadata query on the COG that
    // the user selected when they pressed the search button. It will return a collection of nodes representing
    // all the metadat on that COG reference and then attach those nodes to the initial selected node.

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
                res.send({"status" : "err", "message": "Cannot find a gene with this identifier"});
                return;
            }


            if ( gene.cog_ref == "NA" ) { // currently not handling COG references that are NA, filter these out
                res.send({"status" : "err", "message": "Cannot show COG metadata for an 'NA' COG reference"});
                return;
            }

            // find a the entry for this genes COG
            Cog.findOne( {
                "cog_id": gene.cog_ref
            }, function( err, result ) {
                if ( err ) res.send( err );

                data_nodes = addNodeCategory(true, data_nodes, 'cohort', 'Cohort', GRP_PPL, root_id, 'Distribution over cohort', result.sampled_from, SEQ_BLAST_SCALE, true );

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

                            data_nodes.push( createEdge( 'e_' + people[ i ].id + '_age', 'n_' + people[ i ].id, 'n_age_' + getAgeKey( people[ i ].age ), '', EDGE_WIDTH,  GRP_AGE ) );
                            data_nodes.push( createEdge( 'e_' + people[ i ].id + '_bmi', 'n_' + people[ i ].id, 'n_bmi_' + getBMIKey( people[ i ].bmi ), '', EDGE_WIDTH,  GRP_BMI ) );
                            data_nodes.push( createEdge( 'e_' + people[ i ].id + '_gender', 'n_' + people[ i ].id, 'n_gender_' + getGenderKey( people[ i ].gender ), '', EDGE_WIDTH,  GRP_GENDER ) );
                            data_nodes.push( createEdge( 'e_' + people[ i ].id + '_ibd', 'n_' + people[ i ].id, 'n_ibd_' + getIBDKey( people[ i ].ibd ), '', EDGE_WIDTH,  GRP_IBD ) );

                        };

                        data[ 'nodes' ] = data_nodes;
                        console.log( 'sending  data ' + data );
                        res.send( data );

                    } ); // end of person find
                } ); // end of reference find
            } ); // end of cog find
        } ); // end of genome find
    } ); // end of router get



    // ************************************************************

    // Gene Search: Expand: This graph will perform a weighted metadata query on the gene that
    // the user selected when they pressed the search button. It will return a collection of nodes representing
    // all the metadata of that gene and then attach those nodes to the initial selected node.


    router.get( '/api/data/graph/seq/gene/:_id', function( req, res ) {

        var data = {};
        var data_nodes = [];
        var root_id = req.params._id;


        // find the gene that user clicked on to expand
        Genome.findOne( {
            "_id": root_id
        }, function( err, gene ) {
            if ( err ) res.send( err );

            if ( !gene ) {
                res.send({"status" : "err", "message": "Cannot find a gene with this identifier"});
                return;
            }

            Person.find({}, function(err, people) {

                Ref.findOne( {}, function( err, ref ) {

                    var gene_data = createGeneDataStructure(people);
                    populateGeneData(gene_data, people, gene );

                    data_nodes = addNodeCategory(true, data_nodes, 'cohort', 'Cohort', GRP_PPL, root_id, 'Distribution over cohort', gene_data.cohort, SEQ_BLAST_SCALE, true );
                    data_nodes = addNodeCategoryFromKeys( true, data_nodes, 'age', 'Age', GRP_AGE, root_id, 'Distribution over age', KEYS_AGE, gene_data.age, ref.age, SEQ_BLAST_SCALE )
                    data_nodes = addNodeCategoryFromKeys( true, data_nodes, 'gender', 'Gender', GRP_GENDER, root_id, 'Distribution over gender', KEYS_GENDER, gene_data.gender, ref.gender, SEQ_BLAST_SCALE );
                    data_nodes = addNodeCategoryFromKeys( true, data_nodes, 'bmi', 'BMI', GRP_BMI, root_id, 'Distribution over BMI', KEYS_BMI, gene_data.bmi, ref.bmi, SEQ_BLAST_SCALE );
                    data_nodes = addNodeCategoryFromKeys( true, data_nodes, 'ibd', 'IBD', GRP_IBD, root_id, 'Distribution over IBD', KEYS_IBD, gene_data.ibd, ref.ibd, SEQ_BLAST_SCALE );

                    for ( var i = 0; i < END_OF_COHORT; i++ ) {

                        data_nodes.push( createEdge( 'e_' + people[ i ].id + '_age', 'n_' + people[ i ].id, 'n_age_' + getAgeKey( people[ i ].age ), '', EDGE_WIDTH,  GRP_AGE ) );
                        data_nodes.push( createEdge( 'e_' + people[ i ].id + '_bmi', 'n_' + people[ i ].id, 'n_bmi_' + getBMIKey( people[ i ].bmi ), '', EDGE_WIDTH,  GRP_BMI ) );
                        data_nodes.push( createEdge( 'e_' + people[ i ].id + '_gender', 'n_' + people[ i ].id, 'n_gender_' + getGenderKey( people[ i ].gender ), '', EDGE_WIDTH,  GRP_GENDER ) );
                        data_nodes.push( createEdge( 'e_' + people[ i ].id + '_ibd', 'n_' + people[ i ].id, 'n_ibd_' + getIBDKey( people[ i ].ibd ), '', EDGE_WIDTH,  GRP_IBD ) );

                    };

                    data[ 'nodes' ] = data_nodes;

                    res.send( data );
                }) // end of reference find
            }) // end of person find
        } ); // end of genome find
    } ); // end of router get


    // populates a gene strcture with metadata on a gene.
    function populateGeneData(gene_data, people, gene ){
        for (var i = 0; i < gene.similar_scaffolds.length; i++) {
            var p_index = findPersonIndex(people, gene.similar_scaffolds[i].person_id);
            console.log("werwerewrwer");
            gene_data.age[getAgeKey(people[p_index].age)].count++;
            gene_data.bmi[getBMIKey(people[p_index].bmi)].count++;
            gene_data.gender[getGenderKey(people[p_index].gender)].count++;
            gene_data.ibd[getIBDKey(people[p_index].ibd)].count++;
            gene_data.cohort[findPersonIndex(gene_data['cohort'], people[p_index].id)].count++;

        }
    }

    // creates an empty metadata structure ready to be populated
    function createGeneDataStructure(people_array) {

        var gene_data = {};
        gene_data['age'] = {};
        gene_data['bmi'] = {};
        gene_data['gender'] = {};
        gene_data['ibd'] = {};
        gene_data['cohort'] = [];

        for (var i = 0; i < KEYS_AGE.length; i++) {
            gene_data.age[KEYS_AGE[i]] = {}
            gene_data.age[KEYS_AGE[i]].count = 0;
        }
        for (var i = 0; i < KEYS_BMI.length; i++) {
            gene_data.bmi[KEYS_BMI[i]] = {};
            gene_data.bmi[KEYS_BMI[i]].count = 0;
        }
        for (var i = 0; i < KEYS_GENDER.length; i++) {
            gene_data.gender[KEYS_GENDER[i]] = {};
            gene_data.gender[KEYS_GENDER[i]].count = 0;
        }
        for (var i = 0; i < KEYS_IBD.length; i++) {
            gene_data.ibd[KEYS_IBD[i]] = {};
            gene_data.ibd[KEYS_IBD[i]].count = 0;
        }
        for (var i = 0; i < END_OF_COHORT; i++) {
            gene_data.cohort[i] = {};
            gene_data.cohort[i].id = people_array[i].id;
            gene_data.cohort[i].count = 0;
        }
        return gene_data;
    }


    // used to determine the maximum counts in order to scale the nodes correctly so that they dont exceed the maximum
    // size and also that all nodes are sized proportional to each other. Can size the nodes relative to their occurence
    // or relative to their occurence and that properties occurence within the cohort (weighting).
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

    // This is used for creating a category of nodes from an array of objects with a count property.
    // Currently, its used to create the "cohort" category.

    function addNodeCategory(has_id, node_array, category, cat_label, group, edge_source, edge_label, metadata_array, scale, extra_link ){
        var cat_node_size = resolveCategoryNodeSize(scale);
        var node_unit = getUnitScale(metadata_array);

        var edge_source = edge_source; // local scope

        // adjustment used for showing cohort distribution in graphs: adds a node which
        // which lowers the level of all the descendent nodes. Makes the graph easier to
        // understand when edges link back to equal levels.
        if (extra_link) {
            node_array.push( createNode( 'n_'+category+'link', cat_node_size, cat_node_size, WHITE, ' - ', group ));
            node_array.push( createEdge( 'e_'+category+"link", edge_source, 'n_'+category+'link', ' ', EDGE_WIDTH,  CAT_NODE ) );
            edge_source = 'n_'+category+'link';
        }
        // create category node and edge
        node_array.push( createNode( 'n_'+category, cat_node_size, cat_node_size, CAT_NODE, cat_label, group ));
        node_array.push( createEdge( 'e_'+category, edge_source, 'n_'+category, edge_label, EDGE_WIDTH,  CAT_NODE ) );

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
            node_array.push( createEdge( 'e_' + name, 'n_'+ category, 'n_' + name, 'Occurrences: ' + count, EDGE_WIDTH, group ) );
        }

        return node_array;

    }

    // this function will create nodes and edges for an entire category of nodes.
    // The format of the category structure must be object orientated - not array
    function addNodeCategoryFromKeys( is_weighted, node_array, category, cat_label, group, edge_source, edge_label, key_array, metadata_array, ref_array, scale ) {

        var node_unit = getNodeUnitFromKeys( is_weighted, key_array, metadata_array, ref_array );
        var cat_node_size = resolveCategoryNodeSize(scale);

        node_array.push( createNode( 'n_' + category, cat_node_size, cat_node_size, CAT_NODE, cat_label, group ) );
        node_array.push( createEdge( 'e_' + category, edge_source, 'n_' + category, edge_label, EDGE_WIDTH, CAT_NODE ) );


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

            is_weighted ? label = 'Score: ' : label = 'Count: ';

            node_array.push( createNode( 'n_' + name, node_size, node_size, group, current_key ) );
            node_array.push( createEdge( 'e_' + name, 'n_' + category, 'n_' + name, label + score, EDGE_WIDTH, group ) );

        }

        return node_array;
    }

    // given an id, use this function to find the index for that person
    function findPersonIndex( array, person_id ) {
        for ( var i = 0; i < array.length; i++ ) {
            if ( array[ i ].id == person_id ) {
                return i;
            }
        }
    }

    // this function takes a category array. It iterates over the array to find the maximum count
    // that exists. Using this we an perform a linear interpolation on the node sizes to ensure they
    // remain within size bounderies but still size themselves proportionally to the max count.
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
        // use the following check to ensure that nodes have a size above 0. If
        // nodes are not above 0 then cytoscape automatically doesnt draw an edge to this node.
        if ( resolved_size < MIN_NODE_SIZE ) {
            resolved_size = MIN_NODE_SIZE;
        }
        return resolved_size
    }

    // ensures category nodes are the same size and scaled proportionally
    function resolveCategoryNodeSize( graph_scale ) {
        return ( CAT_NODE_SCALE * CAT_NODE_PERCENT_SIZE ) * graph_scale;
    }

    // function to create a single node
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

    // function to create a single edge
    function createEdge( edge_id, source_node, target_node, label, width, colour ) {
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
                'line-color': colour,
                'target-arrow-color': colour,
            },

            classes: 'autorotate outline',
        }
    }


    // metadata nodes represent an age range.
    // use this to quickly determine the age range an age lies in. This will return that age range
    // which can be used as an index
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

    // metadata nodes represent a BMI range.
    // use this to quickly determine the bmi range a bmi value lies in. This will return that bmi range
    // which can be used as an index
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
