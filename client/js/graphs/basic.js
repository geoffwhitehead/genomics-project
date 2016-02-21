//var cy = $("#cy").cytoscape("get");
var cy = "";
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

        layout:
        {
            name: 'grid',
            rows: 1
        }

    });
}


function addNodes(nodes){
    cy.load( nodes.data );  // use this to re draw graph with these nodes
    //cy.add(nodes);        // use this to add nodes to current graph
}
