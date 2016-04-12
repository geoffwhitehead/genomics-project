mainApp.controller('DataController', function($rootScope, $scope, dataFactory, $log, $window)
{

    var errorHandler = function(err)
    {
        console.log(err);
    };
    var minInput = 2;
    $scope.geneSearch = '';

    //create the initial cytoscape graph instance.
    dataFactory.getGraph().then(function(data)
    {
        $scope.nodes = data.data; // can get some data here for testing
        drawGraph();
    });

    // query database for genes with search string
    $scope.inputChanged = function()
    {
        if ($scope.geneSearch.length >= minInput)
        {
            // perform query and get new scope for genes
            dataFactory.getGeneSearch($scope.geneSearch.toUpperCase()).then(function(data)
            {
                $scope.genes = data.data;
            }).catch(errorHandler);

        }
        else
        {
            $scope.genes = '';
        }
    };

    // get the reference graph based on query input
    $scope.fetchGraphRef = function()
    {
        dataFactory.getGraphRef($scope.geneSearch.toUpperCase()).then(function(payload)
        {
            $scope.nodes = payload.data;
            addNodes(payload.data);
        });
    };

    // get the reference graph based on query input
    $scope.fetchGraphRef2 = function()
    {
        dataFactory.getGraphRef2($scope.geneSearch.toUpperCase()).then(function(payload)
        {
            $scope.nodes = payload.data;
            addNodes(payload.data);
        });
    };

    // get the reference graph based on query input
    $scope.fetchGraphRef3 = function()
    {
        dataFactory.getGraphRef3($scope.geneSearch.toUpperCase()).then(function(payload)
        {
            $scope.nodes = payload.data;
            addNodes(payload.data);
        });
    };

    $scope.sequenceQuery = function()
    {
        dataFactory.getGraphSeq($scope.sequenceSearch.toUpperCase()).then(function(payload)
        {
            $scope.nodes = payload.data.nodes;
            $scope.tabular = payload.data.tabular;
            $scope.genomes = payload.data.genomes;
            $scope.selected_genome = null;
            addNodes(payload.data.nodes);
        })
    }

    $scope.expandGraph = function()
    {
        dataFactory.getExpandedSequence($scope.selected_genome.gene._id).then(function(payload)
        {
            for (var i = 0; i < payload.data.nodes.length; i++)
            {
                $scope.nodes[$scope.nodes.length] = payload.data.nodes[i]
                $scope.genomes = $scope.genomes;
            }
            console.log('PAYLOAD ' + payload);
            expandNodes($scope.nodes);
        })
    }
});
