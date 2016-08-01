// (function() {
'use strict';
angular
    .module('application')
    .component('gameWindow', {
        template: `<canvas id="game" style="position:fixed; width: 100%;height: 100%;"></canvas>`,
        controller: ['$timeout', 'apiService', function($timeout, apiService) {
            var canvas, width, height, rows, columns, spots, fontSize, gameWorld, render, element, looper;
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
                                render(res, loc.coords);
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
                            this.name = 'monster';
                        },
                        Spawn: function() {
                            this.text = 's';
                            this.passable = false;
                            this.name = 'spawn';
                        },
                        player: {
                            text: '@',
                            passable: false,
                            type: 'player'
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
                    if (number >= 0.4) {
                        gameObj.ground = grounds.sunshine;
                    }
                    gameWorld.push(gameObj);
                }
                //TODO: build walls / structures
                //set player in middle
                gameWorld[Math.floor(gameWorld.length / 2)].entity = entities.player;

                //render block
                render = function(serverData, location) {
                    var minLat = location.latitude - .0075,
                        maxLat = location.latitude + .0075,
                        minLong = location.longitude - .0095,
                        maxLong = location.longitude + .0095,
                        tickLat = (maxLat - minLat) / columns,
                        tickLong = (maxLong - minLong) / rows;
                    // map each monster spawn through this func
                    serverData.map((spawn) => {
                        // check lat/long range for 1 sq mile
                        if (spawn.lat >= minLat &&
                            spawn.lat < maxLat &&
                            spawn.long >= minLong &&
                            spawn.long < maxLong) {
                            // if it is we gotta figure out where to draw it!
                            var targetX = Math.floor((maxLong - spawn.long) / tickLong);
                            var targetY = Math.floor((maxLat - spawn.lat) / tickLat);
                            console.log(targetY * rows + targetX, minLong, maxLong, minLat, maxLat, spawn, targetX, targetY);
                            gameWorld[targetY * rows + targetX].entity = new entities.Spawn();
                            console.log(spawn.state.data.split(':')[1].split('|'));
                            spawn.state.data.split(':')[1].split('|').map(monster => {
                                if (monster.length > 0) {
                                    var monsterY = parseInt(targetY) + parseInt(monster[2]);
                                    var monsterX = parseInt(targetX) + parseInt(monster[1]);
                                    gameWorld[monsterY * rows + monsterX].entity = new entities.Monster();
                                }
                            });
                        }
                    });
                    canvas.clearRect(0, 0, width * devicePixelRatio, height * devicePixelRatio);
                    gameWorld[Math.floor(gameWorld.length / 2) + Math.floor(rows / 2)].entity = entities.player;
                    // Get list of entities, then cause them to act. 
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
