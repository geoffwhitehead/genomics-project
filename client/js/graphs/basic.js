//var cy = $("#cy").cytoscape("get");
var cy = "";
var cytoscape = require( 'cytoscape' );
var cycola = require( 'cytoscape-cola' );
var cola = require( 'cola' );
var active_node;
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
                },
                {
                    selector: '.unfocused',
                    style: {
                        'opacity': 0.2
                    }
                },
                {
                    selector: '.focused',
                    style: {
                        'opacity': 1
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
        .on ('mouseover', 'node', function(evt){
            active_node = this.id();

            var nodes = cy.nodes();

            for (var i = 0; i < nodes.length; i++) {
                nodes[i].addClass('unfocused')
                nodes[i].connectedEdges().forEach(function(e){
                    e.addClass('unfocused')
                })
            }
            cy.nodes('node[id="'+active_node+'"]').connectedEdges().forEach(function(e){
                e.removeClass('unfocused');
                e.addClass('focused');
                e.connectedNodes().forEach(function(n){
                    n.removeClass('unfocused');
                    n.addClass('focused');
                })
            })
        })
        .on ('mouseout', 'node', function(){

            var nodes = cy.nodes();

            cy.nodes().forEach(function(n){
                n.removeClass('focused');
                n.removeClass('unfocused');
                n.connectedEdges().forEach(function(e){
                    e.removeClass('unfocused');
                    e.removeClass('focused');
                })
            });
        })
}

function addNodes( nodes ) {
    cy.load( nodes ); // use this to re draw graph with these nodes
}

function expandNodes( nodes ) {
    cy.load( nodes );
}
