//var cy = $("#cy").cytoscape("get");
var cy = "";
var cytoscape = require('cytoscape');
var cycola = require('cytoscape-cola');
var cola = require('cola');

cycola( cytoscape, cola ); // register extension
function drawGraph()
{

    // use this for testing some nodes on load
    nodes = angular.element(document.querySelector('[ng-controller="DataController"]')).scope().nodes;

    cy = cytoscape(
    {

        container: document.getElementById('cy'), // container to render in

        style: [
            { // the stylesheet for the graph
                selector: 'node',

                style:
                {
                    'background-color': '#666',
                    'label': 'data(id)'
                }
            },

            {
                selector: 'edge',
                style:
                {
                    'width': 3,
                    'line-color': '#ccc',
                    'target-arrow-color': '#ccc',
                    'target-arrow-shape': 'triangle'
                }
            }
        ],
    });
}

cy.layout({ name: 'spread',
						minDist: 40 })

function addNodes(nodes){
    cy.load( nodes.data );  // use this to re draw graph with these nodes
    //cy.add(nodes);        // use this to add nodes to current graph
}
