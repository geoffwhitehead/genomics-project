console.log( 'generating reference / weights data' );

var fs = require( 'fs' ),
    path = require( 'path' ),
    Person = require( '../models/person' ),
    Ref = require( '../models/ref' ),
    mongoose = require( 'mongoose' ),
    _ = require( 'underscore' ),
    db = 'mongodb://localhost/gene_project';

var ref = new Ref;
const END_OF_COHORT = 9;

mongoose.connect( db, function( err ) {
    if ( err ) console.log( err );
} );

clear();

function clear() {
    Ref.remove( {}, function( err ) {
        if ( err ) console.log( err );
        console.log( 'clearing cogs' );
        startStream();
    } );
}

function startStream() {
    stream = Person.find().stream();

    stream.on( 'data', function( person ) {
        // included temparary check because im currently not using the full cohort
        if ( ( person.id ).replace( /\D/g, '' ) <= END_OF_COHORT ) {
            stream.pause(); // NOTE: pausing the stream not really necessary;
            console.log( 'data' );
            updateRef( person );
        }
    } )

    .on( 'error', function( err ) {
        console.log( err );
    } )

    .on( 'close', function() {
        resolveWeighting();
        console.log( 'stream finished' );
    } )
}



function updateRef( person ) {

    // update age
    var age_key = getAgeKey( person.age );
    ref.age[ age_key ].count++;
    ref.age[ age_key ].people.push( person.id );
    // update bmi_range
    var bmi_key = getBMI( person.bmi );
    ref.bmi[ bmi_key ].count++;
    ref.bmi[ bmi_key ].people.push( person.id );
    // update Gender
    var gender_key = person.gender;
    ref.gender[ gender_key ].count++;
    ref.gender[ gender_key ].people.push( person.id );

    // update ibd
    if ( person.ibd == 'Y' ) {
        var ibd_key = 'yes'
    }
    else {
        var ibd_key = 'no'
    }

    ref.ibd[ ibd_key ].count++;
    ref.ibd[ ibd_key ].people.push( person.id );

    stream.resume();
}

function resolveWeighting() {
    // calculate age weights
    var keys = [ '0-10', '11-20', '21-30', '31-40', '41-50', '51-60', '61-80', '>80' ];
    for ( var key in keys ) {
        // calculate weight by dividing count by 1.00

        if ( ref.age[ keys[ key ] ].count != 0 ) { // check: div 0
            ref.age[ keys[ key ] ].weight = 1.00 / ( ref.age[ keys[ key ] ].count );
        }
    }


    // calculate bmi weights
    var keys = [ 'underweight', 'normal', 'overweight', 'obese' ];
    for ( var key in keys ) {
        // calculate weight by dividing count by 1.00

        if ( ref.bmi[ keys[ key ] ].count != 0 ) { // check: div 0
            ref.bmi[ keys[ key ] ].weight = 1.00 / ( ref.bmi[ keys[ key ] ].count );
        }
    }

    // calculate gender weights
    var keys = [ 'male', 'female' ];
    for ( var key in keys ) {
        // calculate weight by dividing count by 1.00

        if ( ref.gender[ keys[ key ] ].count != 0 ) { // check: div 0
            ref.gender[ keys[ key ] ].weight = 1.00 / ref.gender[ keys[ key ] ].count;
        }
    }
    // calculate ibd weights
    var keys = [ 'yes', 'no' ];
    for ( var key in keys ) {
        // calculate weight by dividing count by 1.00

        if ( ref.ibd[ keys[ key ] ].count != 0 ) { // check: div 0
            ref.ibd[ keys[ key ] ].weight = 1.00 / ( ref.ibd[ keys[ key ] ].count );
        }
    }
    console.log( 'finished calculating weights' );
    // save the record and then exit
    ref.save( function( err ) {
        if ( err ) {
            console.log( err )
        }
        console.log( 'reference log saved' );
        process.exit( 1 );
    } )
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
