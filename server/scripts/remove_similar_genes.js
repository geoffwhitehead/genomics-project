console.log( 'removing similar genes from dataset' );

var fs = require( 'fs' ),
    path = require( 'path' ),
    Genome = require( '../models/genome' ),
    Ref = require( '../models/ref' ),
    mongoose = require( 'mongoose' ),
    db = 'mongodb://localhost/gene_project';

var counter_total = 0;
var counter = 0;
var processed = 0;
var finished = false;
const INC = 1000;

mongoose.connect( db, function( err ) {
    if ( err ) console.log( err );
} );


stream = Genome.find( ).stream();

stream.on( 'data', function( gene ) {

    counter++;
    counter_total++;
    if ( counter == INC ) {
        console.log( "--> genes affected: " + counter_total );
        counter = 0;
    }
    gene.similar_scaffolds = [];

    gene.save(function(err){
        if(err) console.log("ERROR: " + err);
        processed++;
        if ( processed == counter_total && finished == true ) {
            console.log( "\n\n ***** COMPLETE: total genes affected: " + counter_total + "*****" );
            process.exit(1);
        }
    });

} )

.on( 'error', function( err ) {
    console.log( err );
} )

.on( 'close', function() {

    console.log( 'stream finished' );
    finished = true;

} )
