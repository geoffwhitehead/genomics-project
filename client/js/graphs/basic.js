//var cy = $("#cy").cytoscape("get");
var cy = "";
var cytoscape = require( 'cytoscape' );
var cycola = require( 'cytoscape-cola' );
var cola = require( 'cola' );

cycola( cytoscape, cola ); // register extension
function drawGraph() {

    // use this for testing some nodes on load
    //nodes = angular.element(document.querySelector('[ng-controller="DataController"]')).scope().nodes;

    cy = cytoscape( {

            container: document.getElementById( 'cy' ), // container to render in

            style: [ { // the stylesheet for the graph
                    selector: 'node',

                    style: {
                        'background-color': '#666',
                        'label': 'data(id)'
                    }
                },

                {
                    selector: 'edge',
                    style: { // defaults
                        'width': 3,
                        'line-color': '#ccc',
                        'target-arrow-color': '#ccc',
                        'target-arrow-shape': 'triangle'
                    }
                }, {
                    selector: '.autorotate',
                    style: {
                        'edge-text-rotation': 'autorotate'
                    }
                }, {
                    selector: '.outline',
                    style: {
                        'text-outline-color': '#ccc',
                        'text-outline-width': 3
                    }
                }, {
                    selector: '.multiline-manual',
                    style: {
                        'text-wrap': 'wrap'
                    }
                }

            ],
            layout: {
                name: 'breadthfirst',
                directed: true,
                padding: 0
            },

        } )
        .on( 'click', 'node', function() {

            console.log( 'clicked ' + this.id() );
            var scope = angular.element( document.getElementById( 'cy' ) ).scope();
            var id = this.id();
            scope.$apply( function() {
                scope.selected_genome = scope.genomes[ id ];
            } );
        } )
}

function addNodes( nodes ) {
    cy.load( nodes ); // use this to re draw graph with these nodes
}

function expandNodes( nodes ) {
    cy.load( nodes );
}
