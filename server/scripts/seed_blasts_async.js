console.log( 'inserting blast data from: ' + process.argv[ 2 ] );
var currentdate = new Date();
console.log( 'job started on: ' + currentdate )

var fs = require( 'fs' ),
    path = require( 'path' ),
    Genome = require( '../models/genome' ),
    mongoose = require( 'mongoose' ),
    LineByLineReader = require( 'line-by-line' ),
    db = 'mongodb://localhost/gene_project';

mongoose.connect( db, function( err ) {
    if ( err ) console.log( '1: ' + err );
} );

var file_directory = "/Users/geoffwhitehead/data/network_project/blasts/parsed/";
var file = path.join( file_directory, process.argv[ 2 ] );
console.log( file );
var lr = new LineByLineReader( file );

var records_i = 0;
var records_j = 0;
var linecount = 0;
var gene_found;
var unfound = 0;
var lines_read = 0
var lines_read_counter = 0;
var before_save = 0;
var before_save_counter = 0;
const MAX_STREAMS = 3000;
const MIN_STREAMS = 10;
const INC = 100;
var current_streams = 0;

lr.on( 'error', function( err ) {
    console.log( 'ERROR: ' + err );
} );

lr.on( 'line', function( line ) // read in a line
    {
        current_streams++;
        if (current_streams == MAX_STREAMS) {
            lr.pause();
        }
        lines_read++;
        lines_read_counter ++ ;
        if (lines_read_counter == INC) {
            console.log('lines read in' + lines_read);
            lines_read_counter = 0;
        }

        var segments  = line.toString().split( '\t' );

        segments[0] = segments[0].toString().replace( new RegExp( '_', 'g' ), ':' );
        segments[0] = segments[0].toString().replace( ':', '_' );
        segments[0] = segments[0].toString().replace( ':', '_' );
        segments[0] = segments[0].toString().replace( ':', '_' );
        segments[0] = segments[0].toString().replace( 'scaffold', '' ); // some of the files still contain this

        var fields = segments[0].toString().split( '_' );

        var genome = Genome.findOne( {
                code: fields[ 0 ],
                person_id: fields[ 1 ],
                scaffold: fields[ 2 ],
                location: new RegExp( fields[ 3 ] + ":?-?\\+?", "i" ), // ignore the :+ or - at the end of locators
            },
            function( err, genome ) {
                if ( err ) console.log( 'error finding: ' + err );
                if ( genome ) {
                    //console.log('found genome');
                    var data = [];
                    var array = segments;
                    var processed = 0;


                    for ( var i = 1; i < array.length; i++ ) {
                        array[ i ] = array[ i ].toString().replace( 'scaffold', '' );
                        var fields = array[ i ].toString().split( '_' );
                        genome.similar_scaffolds.push( {
                            scaffold: fields[ 0 ],
                            location: fields[ 1 ],
                            person_id: fields[ 2 ],
                            blast_id: fields[ 3 ],
                        } )
                    }

                    before_save ++;
                    before_save_counter ++;

                    if (before_save_counter == INC) {
                        console.log("----> before saving: " + before_save);
                        before_save_counter = 0;
                    }


                    genome.save( function( err, data ) { // SAVE

                        if ( err ) {
                            lr.emit( 'error', err, genome );
                        }
                        else {
                            records_i++;
                            records_j++;
                            current_streams--;
                            if (current_streams == MIN_STREAMS) {
                                lr.resume();
                            }
                            if ( records_j == INC ) {
                                console.log( "\n*****" + records_i + ': updated!' );
                                console.log( "*****" + unfound + ': not found!\n' );
                                records_j = 0;
                            }
                            if ((records_i + unfound) == lines_read) {
                                console.log("\nCOMPLETE");
                                console.log( records_i + ': updated!' );
                                console.log( unfound + ': not found!' );
                                var currentdate = new Date();
                                console.log( 'last job completed on: ' + currentdate + "\n\n\n")
                                process.exit(1);
                            }

                        }
                    } );
                }
                else { //no match found
                    unfound++;
                    current_streams--;
                    if (current_streams == MIN_STREAMS) {
                        lr.resume();
                    }
                }
                if (records_i + unfound == lines_read) {
                    console.log("\nCOMPLETE");
                    console.log( records_i + ': updated!' );
                    console.log( unfound + ': not found!' );
                    var currentdate = new Date();
                    console.log( 'last job completed on: ' + currentdate + "\n\n\n")
                    process.exit(1);
                }

            }
        );
    } );
lr.on( 'end', function() {
    console.log( "done reading in!" )
} )
