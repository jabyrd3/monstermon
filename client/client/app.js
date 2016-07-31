(function() {
    'use strict';
    angular.module('application', ['ui.router', 'panniers']).config(['$stateProvider', function($stateProvider) {
            $stateProvider.state('root', {
                abstract: false,
                url: '/',
                views: {
                    'app': {
                        template: `
                        <h1>standard issue</h1>
                        <div ui-view="content"></div>
                        <div ui-view="footer"></div>
                        <div ui-view="modalSlot"></div>
                        `,
                        controller: 'AppController'
                    }
                }
            });
        }])
        .constant('PanniersConfig', { api: { app: 'http://localhost:8000' } }).controller('AppController', ['apiService', function(apiService) {
            console.log('barebones angular nodejs postgres starter');
            apiService.get().then(res => {
                window.alert(res);
            });
        }]);
})();
