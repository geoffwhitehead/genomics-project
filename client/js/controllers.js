mainApp.controller('DataController', function($rootScope, $scope, dataFactory, $log, $window)
{

    var errorHandler = function(err)
    {
        console.log(err);
    };

    // get all studies on Load
    dataFactory.getStudies().then(function(data)
    {
        $scope.studies = data.data;
    });

    dataFactory.getGenes().then(function(data)
    {
        $scope.genes = data.data;
    }).catch(errorHandler);

    dataFactory.getRelationships().then(function(data)
    {
        $scope.relationships = data.data;
    }).catch(errorHandler);

    dataFactory.getNodes().then(function(data)
    {
        $scope.nodes = data.data;
        drawGraph();
    });

    dataFactory.getNodes().then(function(data)
    {
        $scope.nodes = data.data;
        drawGraph();
    });

    dataFactory.getRead().then(function(data)
    {
        $scope.read = data.data;
    });



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
