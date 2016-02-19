//var cy = $("#cy").cytoscape("get");
function drawGraph()
{

    nodes = angular.element(document.querySelector('[ng-controller="DataController"]')).scope().nodes;

    var cy = cytoscape(
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

    cy.add(nodes);
}
