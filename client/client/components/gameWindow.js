// (function() {
'use strict';
angular
    .module('application')
    .component('gameWindow', {
        template: `<canvas id="game" style="position:fixed; width: 100%;height: 100%;"></canvas>`,
        controller: ['$timeout', 'apiService', function($timeout, apiService) {
            var canvas, width, height, rows, columns, spots, fontSize, gameWorld, render, element, looper, location;
            this.$onInit = () => {
                looper = () => {
                    window
                        .navigator
                        .geolocation
                        .getCurrentPosition(loc => {
                            // console.log(loc);
                            apiService.heartbeat().post({
                                lat: loc.coords.latitude,
                                long: loc.coords.longitude
                            }).then(res => {
                                render(res);
                                console.log('this.world', res);
                                $timeout(looper, 1000);
                            });
                        });
                };
                looper();
            };
            this.$postLink = () => {

                //boilerplate and var scoping, game entities definitions
                element = document.getElementById('game'),
                    canvas = document.getElementById('game').getContext('2d'),
                    width = window.innerWidth * window.devicePixelRatio,
                    height = window.innerHeight * window.devicePixelRatio,
                    rows = 60,
                    columns = 60,
                    spots = rows * columns,
                    fontSize = Math.floor(height / rows * window.devicePixelRatio),
                    gameWorld = [];
                element.width = width * devicePixelRatio;
                element.height = height * devicePixelRatio;
                console.log(width, height);
                //content
                var grounds = {
                        dirt: {
                            text: '\u2591',
                            //                    text: '.',
                            type: 'dirt',
                            status: 'you are on some dirt',
                            passable: true
                        },
                        sunshine: {
                            text: ' ',
                            type: 'sunshine',
                            status: 'you are walking on sunshine',
                            passable: true
                        },
                        wall: {
                            text: '\u2588',
                            status: 'hey its a wall',
                            passable: false
                        },
                        tree: {
                            text: 't',
                            status: 'back off, im a tree',
                            passable: false
                        }
                    },
                    entities = {
                        Monster: function() {
                            this.text = 'm';
                            this.passable = false;
                            this.name = 'snake';
                        },
                        player: {
                            text: '@',
                            passable: false,
                            type: 'player'
                        }
                    };
                var directionTile = {
                    up: function(pos) {
                        return above(pos);
                    },
                    right: function(pos) {
                        return rightOf(pos);
                    },
                    down: function(pos) {
                        return below(pos);
                    },
                    left: function(pos) {
                        return leftOf(pos);
                    },
                    upLeft: function(pos) {
                        return upLeftOf(pos);
                    },
                    upRight: function(pos) {
                        return upRightOf(pos);
                    },
                    downLeft: function(pos) {
                        return downLeftOf(pos);
                    },
                    downRight: function(pos) {
                        return downRightOf(pos);
                    }
                };
                //canvas globals
                canvas.font = 'bold ' + fontSize + 'px monospace';
                canvas.fillStyle = "black";
                canvas.textAlign = 'center';
                //randomize environment
                for (var i = 0; i < spots; i++) {
                    var number = Math.random();
                    var gameObj = {};
                    gameObj.ground = grounds.dirt;
                    if (number > 0.999) {
                        gameObj.entity = new entities.Monster();
                    } else if (number > 0.988 && number < 0.99) {
                        gameObj.entity = grounds.tree;
                    } else if (number >= 0.4) {
                        gameObj.ground = grounds.sunshine;
                    } else if (number < 0.4) {
                        gameObj.ground = grounds.dirt;
                    } else {
                        gameObj.ground = grounds.dirt;
                    }
                    gameWorld.push(gameObj);
                }
                //TODO: build walls / structures
                //set player in middle
                gameWorld[Math.floor(gameWorld.length / 2)].entity = entities.player;
                console.log(Math.floor(gameWorld.length / 2), gameWorld, gameWorld[Math.floor(gameWorld.length / 2)]);

                //render block
                render = function(serverData) {
                    debugger;
                    canvas.clearRect(0, 0, width, height);
                    gameWorld[Math.floor(gameWorld.length / 2) + Math.floor(rows / 2)].entity = entities.player;
                    // Get list of entities, then cause them to act. Two-pass counter-telesnake method
                    var actionableEntities = [];
                    // actionable entities
                    for (var i = 0; i < gameWorld.length; i++) {
                        if (gameWorld[i].entity !== undefined) {
                            actionableEntities.push(i);
                        }
                    }
                    // build and render row
                    for (var y = 0; y < rows; y++) {
                        var rowText = '';
                        var rowArray = gameWorld.slice(y * columns, (y + 1) * columns);
                        for (var x = 0; x < rowArray.length; x++) {
                            var gameObj = rowArray[x];
                            if (gameObj.entity === undefined) {
                                rowText += gameObj.ground.text;
                            } else {
                                rowText += gameObj.entity.text;
                            }
                        }
                        canvas.fillText(rowText, 1000, y * fontSize + fontSize);
                    }
                };
            };
        }]
    });
// })();
