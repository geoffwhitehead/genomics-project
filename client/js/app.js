mainApp = angular.module('mainApp', ['ngRoute'])
.config(function($routeProvider)
{
    $routeProvider
        .when('/',
        {
            templateUrl: '/partials/data.htm',
            controller: 'DataController'
        })

    .otherwise(
    {
        redirectTo: '/'
    });
});
