mainApp = angular.module('mainApp', ['ngRoute'])
    .config(function($routeProvider)
    {
        $routeProvider
            .when('/',
            {
                templateUrl: '/partials/about.html',
                controller: 'DataController'
            })
            .when('/about',
            {
                templateUrl: '/partials/about.html',
                controller: 'DataController'
            })
            .when('/reference',
            {
                templateUrl: '/partials/ref_search.html',
                controller: 'DataController'
            })
            .when('/sequential',
            {
                templateUrl: '/partials/seq_search.html',
                controller: 'DataController'
            })

        .otherwise(
        {
            redirectTo: '/'
        });
    });
