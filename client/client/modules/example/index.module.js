'use strict';
/* globals angular */
angular.module('application.example', [])
    .config(['$stateProvider', function($stateProvider) {
        $stateProvider.state('root.example', {
            abstract: true,
            url: 'example',
            views: {
                'content@root': {
                    template: `
                            <h1>example module</h1>
                        `
                }
            }
        });
    }]);
