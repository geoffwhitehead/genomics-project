console.log( 'generating cog/kog metadata' );

var fs = require( 'fs' ),
    path = require( 'path' ),
    Person = require( '../models/person' ),
    Cog = require( '../models/cog' ),
    Genome = require( '../models/genome' ),
    mongoose = require( 'mongoose' ),
    _ = require( 'underscore' ),
    ps = require( 'pause-stream' )();
db = 'mongodb://localhost/gene_project';


mongoose.connect( db, function( err ) {
    if ( err ) console.log( err );
} );
var people_array = [];
var count = 0;
var cogs_evaluated = 0;
var unidentied = 0;
var processed = 0;
var counter = 0;
var counter_temp = 0;
var stream;
var similars = 0;
const END_OF_COHORT = 9;

run();

function clear() {
    Cog.remove( {}, function( err ) {
        if ( err ) console.log( err );
        console.log( 'clearing cogs' );
        startStream();
    } );
}

function startStream() {
    stream = Genome.find().stream();
    stream.on( 'data', function( genome ) {
        stream.pause();
        if ( counter_temp == 1000 ) {
            console.log( "count: " + count +
                " : processed: " + processed +
                " : cogs eval: " + cogs_evaluated +
                " : unidentied cogs: " + unidentied +
                " : occurences processed: " + similars);
            counter_temp = 0;
        }
        count++;
        counter = 0; // reset the counter for each genome
        updateGenome( genome );
        counter_temp++;
    } )

    .on( 'error', function( err ) {
        console.log( err );
    } )

    .on( 'close', function() {
        console.log( 'stream finished' );
    } )
}

function updateGenome( genome ) {

    if ( genome.cog_ref !== 'NA' ) {

        // some genomes contain kegg and cog refs
        var cogs = genome.cog_ref.toString().split( ';' );
        for ( var i = 0; i < cogs.length; i++ ) {
            updateCog( cogs[ i ], genome, cogs.length );


        }
        processed++; // gene has been processed
    }
    else {
        unidentied++; // gene was unidentified
        stream.resume();
    }

}


function updateCog( id, genome, arr_size ) {


    Cog.find( {
        cog_id: id
    }, function( err, result_cogs ) {
        if ( err ) console.log( err );

        var c;


        if ( result_cogs.length > 1 ) {
            console.log( 'ERROR : duplicate entry' );
            exit( 1 );
        }

        // if this a new record, create a new cog, else use the cog returned
        if ( result_cogs.length == 0 ) {
            c = initCog( new Cog() );
            c.cog_id = id;
        }
        else {
            c = result_cogs[ 0 ];
        }

        // loop through all the similar scaffolds and record the metadata
        for ( var i = 0; i < genome.similar_scaffolds.length; i++ ) {
            // pull the record for the person associated to this genome
            var person = findPerson( genome.similar_scaffolds[i].person_id );
            var genome_code = genome.similar_scaffolds

            c.sampled_from[ findPersonIndex( person.id, c ) ].count++;

            var key = getAgeKey( person.age );
            c.metadata.age[ key ].count++;
            //c.metadata.age[ key ].genomes.push( genome.code );

            key = getBMI( person.bmi );
            c.metadata.bmi[ key ].count++;
            //c.metadata.bmi[ key ].genomes.push( genome.code );

            if ( person.gender == 'male' ) {
                c.metadata.gender.male.count++;
                //c.metadata.gender.male.genomes.push( genome.code );
            }
            else {
                c.metadata.gender.female.count++;
            //    c.metadata.gender.female.genomes.push( genome.code );
            }

            if ( person.ibd == 'Y' ) {
                c.metadata.ibd.yes.count++;
                //c.metadata.ibd.yes.genomes.push( genome.code );

            }
            else {
                c.metadata.ibd.no.count++;
                //c.metadata.ibd.no.genomes.push( genome.code );
            }
            similars ++ ;
        }

        c.save( function( err ) {
            if ( err ) console.log( err );
            counter++;
            cogs_evaluated++;
            // resume the stream if this is the last COG
            if ( counter == arr_size ) {
                stream.resume();
            }
        } );
    } );
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

var initCog = function( cog ) {
    for ( var i = 0; i < people_array.length; i++ ) {
        if ( ( people_array[ i ].id ).replace( /\D/g, '' ) <= END_OF_COHORT ) {
            var person = people_array[ i ]
            cog.sampled_from.push( {
                'id': person.id,
                'count': 0
            } );
        }
    }
    return cog;
}

// look in person array of a COG and returns the index of the person query id
function findPersonIndex( query_id, cog ) {
    for ( var i = 0; i < cog.sampled_from.length; i++ ) {
        if ( cog.sampled_from[ i ].id == query_id ) {
            return i;
        }
    }
    console.log( 'ERROR: ' + 'person not found' );
    exit( 1 );
}




function run() {
    Person.find( {}, function( err, people ) {
        if ( err ) console.log( err );
        people_array = people;
        clear();
    } );
};

// looks in the person array and return the matching person object
var findPerson = function( person_id ) {
    for ( var i = 0; i < people_array.length; i++ ) {
        if ( people_array[ i ].id == person_id ) {
            return people_array[ i ];
        }
    }
}
