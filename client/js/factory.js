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
        return $http.get(urlBase + "/graph/ref/"+req);
    };




    // _service.getStudies = function()
    // {
    //     return $http.get(urlBase + "/studies");
    // };
    // _service.getRelationships = function()
    // {
    //     return $http.get(urlBase + "/studies/1/genes/1/relationships");
    // };
    // _service.getRead = function()
    // {
    //     return $http.get(urlBase + "/read");
    // };
    return _service;
});
