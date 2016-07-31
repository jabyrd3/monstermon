var express = require('express');
var router = express.Router();
var pool;
/* GET home page. */
var tickWorld = function(client, cb, done) {
    var worldSeed = parseInt(new Date() * (Math.random() * 100));
    client.query('INSERT INTO world_state (time, seed) VALUES ($1, $2)', [new Date(), worldSeed], (err, res) => {
        if (err) {
            return console.log(err);
        }
        done();
        console.log('world ticked');
        cb(worldSeed);
    });
};
// generates states
var createState = (seed, worldSeed, x, y) => {
    // console.log('seed', seed);
    // sample state: 
    // seed:monster|monster|monster
    // monster is a 5char string encoding type and 4 stat values
    // first char is monstertype (thats all i'm going to implement)
    // 
    // at first. eventually there could be more chars in here for
    // encodign monster state.

    var localState = parseInt(seed / 1000 + worldSeed / 1000);
    // console.log('localState', localState, seed, worldSeed);
    var state = `${seed}:`;
    for (var i = 0; i < 4; i++) {
        // console.log('statebuilder', i, localState.toString().slice(i, i + 1));
        switch (parseInt(localState.toString().slice(i, i + 1))) {
            case 0:
                // console.log('case state', i, 0);
                state += `023|`;
                break;
            case 1:
                // console.log('case state', i, 1);
                state += `134|`;
                break;
            case 2:
                // console.log('case state', i, 2);
                state += `215|`;
                break;
            case 3:
                // console.log('case state', i, 3);
                state += `342|`;
                break;
            case 4:
                // console.log('case state', i, 4);
                state += `465|`;
                break;
            case 5:
                // console.log('case state', i, 5);
                state += `587|`;
                break;
            case 6:
                // console.log('case state', i, 6);
                state += `678|`;
                break;
            case 7:
                // console.log('case state', i, 7);
                state += `774|`;
                break;
            case 8:
                // console.log('case state', i, 8);
                state += `809|`;
                break;
            case 9:
                // console.log('case state', i, 9);
                state += `988|`;
                break;
        }
    }
    return { gen: new Date().getTime(), data: state };
};
// object for dealing with POI stops (monster spawns, basically)
var Stop = function(lat, long, seed, worldSeed) {
    this.genSeed = () => {
        this.seed = parseInt(new Date().getTime() * parseInt(Math.random() * 100)).toString();
    };
    if (!seed) {
        this.genSeed();
    } else {
        this.seed = seed;
    }
    this.lat = lat;
    this.long = long;
    this.state = createState(this.seed, worldSeed);
    console.log('jab shoudl have latlong', this);
    return this;
};
router.post('/heartbeat', function(req, res, next) {
    var latLong = { lat: req.body.lat, long: req.body.long };
    // console.log('latlong heartbeat', latLong);
    var localStops = [];
    // to run a query we can acquire a client from the pool,
    // run a query on the client, and then return the client to the pool

    pool.connect(function(err, client, done) {
        if (err) {
            return console.error('error fetching client from pool', err);
        }
        client.query('select * from world_state where time = (select max(time) from world_state);', [], function(err, result) {
            // console.log('worldstate', result.rows);
            done();
            // if world state doesnt' yet exist, or if it's older than a minute, 
            // create a new world state / seed.
            console.log(result.rows, req.body, new Date().getTime() - 20000);
            if (result.rows.length === 0 || result.rows[0].time.getTime() < new Date().getTime() - 5000) {
                tickWorld(client, (worldSeed) => {
                    client.query('SELECT * FROM stops WHERE coordinates <-> point($1, $2) < .25;', [latLong.lat, latLong.long], function(err, result) {
                        //call `done()` to release the client back to the pool
                        done();

                        if (err) {
                            return console.error('error running query', err);
                        }
                        // if no spots, add a spot right where they're standing
                        if (result.rows.length === 0) {
                            var stop = new Stop(latLong.lat, latLong.long, false, worldSeed);
                            client.query('INSERT INTO stops (coordinates, seed, state) VALUES (point($1, $2), $3, $4)', [latLong.lat, latLong.long, stop.seed, stop.state], (err, result) => {
                                if (err) {
                                    console.log(err);
                                    res.status(500);
                                }
                                // console.log('new spot created');
                                done();
                                localStops.push(stop);
                                res.send(localStops);
                            });
                        } else {
                            //otherwise, map results and get an array of stops to send to client
                            // console.log(result.rows);
                            result.rows.map(stop => {
                                console.log('bump', stop);
                                localStops.push(new Stop(stop.coordinates.x, stop.coordinates.y, stop.seed, worldSeed));
                            });
                            res.send(localStops);
                        }
                        // res.send(`this is an api ${result.rows[0].number}`);
                        //output: 1
                    });

                }, done);
            } else {
                client.query('SELECT * FROM stops WHERE coordinates <-> point($1, $2) < 1;', [latLong.lat, latLong.long], function(err, stops) {
                    console.log('notcreated', stops.rows)
                    if (err) {
                        return console.log(err);
                    }
                    var localStops = [];
                    //call `done()` to release the client back to the pool
                    stops.rows.map(stop => {
                        console.log('jab stop', stop.coordinates);
                        localStops.push(new Stop(stop.coordinates.x, stop.coordinates.y, stop.seed, result.rows[0].seed));
                    });
                    res.send(localStops);
                    done();
                });
            }

        });
    });
});

module.exports = function(dbPool) {
    pool = dbPool;
    return router;
};
