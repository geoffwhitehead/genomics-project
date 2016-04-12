mainApp.factory('dataFactory', function($http)
{
    var urlBase = '/api/data';
    var _service = {};

    _service.getGeneSearch = function(req)
    {
        return $http.get(urlBase + "/genes/" + req);
    };
    _service.getGraph = function()
    {
        return $http.get(urlBase + "/nodes");
    };
    _service.getGraphRef = function(req)
    {
        return $http.get(urlBase + "/graph/ref/1/"+req);
    };

    _service.getGraphRef2 = function(req)
    {
        return $http.get(urlBase + "/graph/ref/2/"+req);
    };

    _service.getGraphRef3 = function(req)
    {
        return $http.get(urlBase + "/graph/ref/3/"+req);
    };

    _service.getGraphSeq = function(req)
    {
        return $http.get(urlBase + "/graph/seq/"+req);
    };

    _service.getExpandedSequence = function(req){
        console.log("REPSONSE");
        return $http.get(urlBase + "/graph/seq/expand/"+req);
    };

    return _service;
});
