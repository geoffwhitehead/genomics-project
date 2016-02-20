mainApp = angular.module('mainApp', ['ngRoute'])
.config(function($routeProvider)
{
    $routeProvider
        .when('/',
        {
            templateUrl: '/partials/data.html',
            controller: 'DataController'
        })

    .otherwise(
    {
        redirectTo: '/'
    });
});
