mainApp.controller('DataController', function($rootScope, $scope, dataFactory, $log, $window)
{

    var errorHandler = function(err)
    {
        console.log(err);
    };
    var minInput = 2;
    $scope.geneSearch = '';

    // create the initial cytoscape graph instance.
    dataFactory.getGraph().then(function(data)
    {
        $scope.nodes = data.data; // can get some data here for testing
        drawGraph();
    });

    // query database for genes with search string
    $scope.inputChanged = function() {
        if ($scope.geneSearch.length >= minInput){
            // perform query and get new scope for genes
            dataFactory.getGeneSearch($scope.geneSearch.toUpperCase()).then(function(data)
            {
                $scope.genes = data.data;
                console.log("factory data" + data);
            }).catch(errorHandler);

        } else {
            $scope.genes = '';
        }
    };

    // get the reference graph based on query input
    $scope.fetchGraphRef = function(){
    dataFactory.getGraphRef($scope.geneSearch.toUpperCase()).then(function(data)
        {
            $scope.nodes = data.data;
            addNodes(data);
        });
    };

    // get the reference graph based on query input
    $scope.fetchGraphRef2 = function(){
    dataFactory.getGraphRef2($scope.geneSearch.toUpperCase()).then(function(data)
        {
            $scope.nodes = data.data;
            addNodes(data);
        });
    };

    // get the reference graph based on query input
    $scope.fetchGraphRef3 = function(){
    dataFactory.getGraphRef3($scope.geneSearch.toUpperCase()).then(function(data)
        {
            $scope.nodes = data.data;
            addNodes(data);
        });
    };

    //
    // // get all studies on Load
    // dataFactory.getStudies().then(function(data)
    // {
    //     $scope.studies = data.data;
    // });
    // //
    // // dataFactory.getGenes().then(function(data)
    // // {
    // //     $scope.genes = data.data;
    // // }).catch(errorHandler);
    //
    // dataFactory.getRelationships().then(function(data)
    // {
    //     $scope.relationships = data.data;
    // }).catch(errorHandler);
    //
    // // dataFactory.getNodes().then(function(data)
    // // {
    // //     $scope.nodes = data.data;
    // //     drawGraph();
    // // });



    // dataFactory.getRead().then(function(data)
    // {
    //     $scope.read = data.data;
    // });

    // $scope.fetchNodes = function()
    // {
    //     dataFactory.getNodes().then(function(data)
    //     {
    //         $scope.nodes = data.data;
    //         drawGraph();
    //     });
    // };



    /*
      // get a gene
      $scope.get = function(i) {
        genesFactory.getGene($scope.genes[i]._id).then(function(data) {
          if (data.data) {
            $scope.genes.splice(i, 1);
          }
        });
      };
    */

});
