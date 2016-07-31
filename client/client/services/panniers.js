(function() {
    'use strict';
    /* globals _*/
    /* - API access standardizer
    apiService.lightboxes.lightbox(43);
    apiService.lightbox(43)
     * • Use this to make http requests to the API.
     * • it wraps the native angular $http method. It'd be a simple task to write a non-angular specific version of this though.
     *
     * - Sample Usage:
     * apiService.users(42).report(18).put({blah: 12, foo: 'bar'}).then(function(response){
     *  //do stuff with the response 
     * }).catch(function(err){});
     */
    angular.module('panniers', [])
        .factory('apiService', ['$rootScope', '$http', '$q', 'PanniersConfig',
            function($rootScope, $http, $q, PanniersConfig) {
                var service = this;
                window.debugApi = this;
                service.queryStringBuilder = function(obj) {
                    var retString = '?';
                    var strings = [];
                    _.each(obj, function(value, key) {
                        strings.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
                    });
                    retString += strings.join('&');
                    return retString;
                };
                // utility function to mash our URL together
                service.concatenator = function(map, query) {
                    var concat = '';
                    _.each(map, function(val, key) {
                        if (val.value !== false) {
                            concat += '/' + val.name + '/' + val.value;
                        } else {
                            concat += '/' + val.name;
                        }
                    });
                    if (query) {
                        concat += query;
                    }
                    return concat;
                };
                // local object to store query in progress while chaining.
                service.map = {};
                // local object to store query body before request
                service.bodyObj = {};
                // utility function to clear local request state
                var utils = {
                    reset: function() {
                        service.bodyObj = {};
                        service.map = {};
                    }
                };
                // genericize calls for different HTTP method assignment
                // if 'api' is not supplied, will use environment default
                service.genericHttp = function(method, queryString, api, replay, deferred) {
                    // replay happens when a 422 error triggers a refresh cycle. We dont' want
                    // any requests to go out until we've refreshed the user, so we build a
                    // queue for requests so that we can trigger them after.
                    if (!api) {
                        api = PanniersConfig.api.app;
                    }
                    // clone vars to scope and reset so that we don't get collisions
                    if (!replay) {
                        var local = {
                            bodyObj: angular.copy(service.bodyObj),
                            map: angular.copy(service.map)
                        };
                    } else {
                        local = replay;
                    }
                    // clear service for subsequent reqs
                    utils.reset();
                    if (!deferred) {
                        var deferred = $q.defer();
                    }
                    // actually make the http call
                    if (!service.refreshing || service.refreshing.state !== true) {
                        // gotta refactor this to be less ugly
                        var req = {
                            method: method,
                            url: api + service.concatenator(local.map, queryString),
                            data: local.bodyObj,
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        };
                        // dynamic organization id appended in header
                        $http(req)
                            .then(function(response) {
                                deferred.resolve(response.data);
                            }, function(error) {
                                var status = error.status;
                                var statusText = error.statusText;
                                var reason = {
                                    message: error.data.message,
                                    status: status,
                                    statusText: statusText,
                                    errors: error.data.errors
                                };
                                // onerror, if 401 and not already in refreshing mode, 
                                // enter refreshing mode which queues all subsequent 
                                //reqeusts for retry after successful refresh
                                if (status === 401 && (!service.refreshing || service.refreshing.state === false)) {
                                    // try to refresh
                                    service.refreshing = {
                                        state: true,
                                        // set this request to first in queue after refresh
                                        queue: [{
                                            deferred,
                                            method,
                                            queryString,
                                            api,
                                            local
                                        }]
                                    };
                                } else if (status === 401) {
                                    service.refreshing.queue.push({
                                        deferred,
                                        method,
                                        queryString,
                                        api,
                                        local
                                    });
                                    return;
                                } else if (status === 412) {
                                    console.log('status', 412);
                                    // User is not verified
                                    if (api === PanniersConfig.api.app) {
                                        $rootScope.$emit('unverified', 'Please check your inbox and verify your email address to continue.');
                                    }
                                } else {
                                    // useful message for our consumer on non critical error
                                    deferred.reject(reason);
                                }
                            });
                    } else {
                        service.refreshing.queue.push({
                            deferred: deferred,
                            method: method,
                            queryString: queryString,
                            api: api,
                            local: local
                        });
                    };
                    utils.reset();
                    return deferred.promise;
                };
                // sample usage: apiService.gallery(12).asset(3).comment('Note','shot is underexposed').post();
                // dynamically generate a function per parameter for each endpoint. this allows us to chain.
                // bind http verbs to service
                service.post = function(passObj) {
                    if (passObj) {
                        service.bodyObj = passObj;
                    }
                    return service.genericHttp('POST');
                };
                service.get = function(querystring) {
                    if (typeof querystring === 'string') {
                        return service.genericHttp('GET', querystring);
                    } else if (querystring) {
                        return service.genericHttp('GET', service.queryStringBuilder(querystring));
                    }
                    return service.genericHttp('GET');
                };
                service.delete = function(passObj) {
                    if (passObj) {
                        service.bodyObj = passObj;
                    }
                    return service.genericHttp('DELETE');
                };
                service.put = function(passObj) {
                    if (passObj) {
                        service.bodyObj = passObj;
                    }
                    return service.genericHttp('PUT');
                };
                service.patch = function(passObj) {
                    if (passObj) {
                        service.bodyObj = passObj;
                    }
                    return service.genericHttp('PATCH');
                };
                // Allow a scope to subscribe to errors which are emitted on the root scope
                service.subscribeToError = function(name, scope, callback) {
                    var handler = $rootScope.$on(name, function(event, value) {
                        callback(value);
                    });
                    // Unregister when calling scope is destroyed
                    scope.$on('$destroy', handler);
                };
                // internal catchall function to build requests when you hit
                // apiService.whatever
                var EndpointFunction = function(target, propKey) {
                    var internalProcessor = function(inp) {
                        if (inp) {
                            service.map[Object.keys(service.map)
                                .length] = {
                                name: propKey,
                                value: inp
                            };
                        } else {
                            service.map[Object.keys(service.map)
                                .length] = {
                                name: propKey,
                                value: false
                            };
                        }
                        return proxyService;
                    };
                    return internalProcessor;
                };
                var proxyService = new Proxy(service, {
                    get: function(target, propKey, receiver) {
                        if (!(propKey in target)) {
                            return new EndpointFunction(target, propKey, receiver);
                        }
                        return service[propKey];
                    }
                });
                return proxyService;
            }
        ]);
})();
