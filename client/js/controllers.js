mainApp.controller('DataController', function($rootScope, $scope, dataFactory, $log, $window)
{

    var errorHandler = function(err)
    {
        console.log(err);
    };
    var minInput = 2;
    $scope.geneSearch = '';

    // query database for genes with search string
    $scope.inputChanged = function() {
        if ($scope.geneSearch.length >= minInput){
            // perform query and get new scope for genes
            dataFactory.getGeneSearch($scope.geneSearch).then(function(data)
            {
                $scope.genes = data.data;
            }).catch(errorHandler);

        } else {
            $scope.genes = '';
        }
    };

    $scope.fetchGraphRef = function(){
    dataFactory.getGraphRef($scope.geneSearch.toUpperCase()).then(function(data)
//dataFactory.getNodes().then(function(data)
        {
            $scope.nodes = data.data;
            addNodes(data);
        });
    }

    // get all studies on Load
    dataFactory.getStudies().then(function(data)
    {
        $scope.studies = data.data;
    });
    //
    // dataFactory.getGenes().then(function(data)
    // {
    //     $scope.genes = data.data;
    // }).catch(errorHandler);

    dataFactory.getRelationships().then(function(data)
    {
        $scope.relationships = data.data;
    }).catch(errorHandler);

    // dataFactory.getNodes().then(function(data)
    // {
    //     $scope.nodes = data.data;
    //     drawGraph();
    // });

    dataFactory.getNodes().then(function(data)
    {
        $scope.nodes = data.data;
        drawGraph();
    });

    dataFactory.getRead().then(function(data)
    {
        $scope.read = data.data;
    });

    $scope.fetchNodes = function()
    {
        dataFactory.getNodes().then(function(data)
        {
            $scope.nodes = data.data;
            drawGraph();
        });
    };



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
