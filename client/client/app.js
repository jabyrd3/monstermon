(function() {
    'use strict';
    angular.module('application', ['ui.router', 'panniers']).config(['$stateProvider', function($stateProvider) {
            $stateProvider.state('root', {
                abstract: false,
                url: '/',
                views: {
                    'app': {
                        template: `
                        <h1>monstermon</h1>
                        <pre>{{$ctrl.worldstate | json}}</pre>
                        <game-window></game-window>
                        <div ui-view="content"></div>
                        <div ui-view="footer"></div>
                        <div ui-view="modalSlot"></div>
                        `
                    }
                }
            });
        }])
        .constant('PanniersConfig', { api: { app: 'http://localhost:8000' } });
})();
