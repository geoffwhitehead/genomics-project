var mongoose = require( 'mongoose' );

var Schema = mongoose.Schema;

var RefSchema = new Schema( {


    age: {
        '0-10': {
            'count': {
                type: Number,
                default: 0
            },
            'people': [],
            'weight': {
                type: Number,
                default: 1
            }
        },
        '11-20': {
            'count': {
                type: Number,
                default: 0.00
            },
            'people': [],
            'weight': {
                type: Number,
                default: 1
            }
        },
        '21-30': {
            'count': {
                type: Number,
                default: 0
            },
            'people': [],
            'weight': {
                type: Number,
                default: 1
            }
        },
        '31-40': {
            'count': {
                type: Number,
                default: 0
            },
            'people': [],
            'weight': {
                type: Number,
                default: 1
            }
        },
        '41-50': {
            'count': {
                type: Number,
                default: 0
            },
            'people': [],
            'weight': {
                type: Number,
                default: 1
            }
        },
        '51-60': {
            'count': {
                type: Number,
                default: 0
            },
            'people': [],
            'weight': {
                type: Number,
                default: 1
            }
        },
        '61-80': {
            'count': {
                type: Number,
                default: 0
            },
            'people': [],
            'weight': {
                type: Number,
                default: 1
            }
        },
        '>80': {
            'count': {
                type: Number,
                default: 0
            },
            'people': [],
            'weight': {
                type: Number,
                default: 1
            }
        },
    },
    gender: {
        male: {
            'count': {
                type: Number,
                default: 0
            },
            'people': [],
            'weight': {
                type: Number,
                default: 1
            }
        },
        female: {
            'count': {
                type: Number,
                default: 0
            },
            'people': [],
            'weight': {
                type: Number,
                default: 1
            }
        },
    },
    bmi: {
        underweight: {
            'count': {
                type: Number,
                default: 0
            },
            'people': [],
            'weight': {
                type: Number,
                default: 1
            }
        },
        normal: {
            'count': {
                type: Number,
                default: 0
            },
            'people': [],
            'weight': {
                type: Number,
                default: 1
            }
        },
        overweight: {
            'count': {
                type: Number,
                default: 0
            },
            'people': [],
            'weight': {
                type: Number,
                default: 1
            }
        },
        obese: {
            'count': {
                type: Number,
                default: 0
            },
            'people': [],
            'weight': {
                type: Number,
                default: 1
            }
        },
    },
    ibd: {
        yes: {
            'count': {
                type: Number,
                default: 0
            },
            'people': [],
            'weight': {
                type: Number,
                default: 1
            }
        },
        no: {
            'count': {
                type: Number,
                default: 0
            },
            'people': [],
            'weight': {
                type: Number,
                default: 1
            }
        },

    },
} );
module.exports = mongoose.model( 'Ref', RefSchema );
