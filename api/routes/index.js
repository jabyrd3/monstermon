var express = require('express');
var router = express.Router();
var pool;
/* GET home page. */
var tickWorld = function(client, cb, done) {
    var worldSeed = parseInt(new Date().getTime() * (Math.random() * 100));
    client.query('INSERT INTO world_state (time, seed) VALUES $1, $2', [new Date().getTime(), worldSeed], (err, res) => {
        done();
        console.log('world ticked');
        cb(worldSeed);
    });
};
// generates states
var createState = (seed, worldSeed) => {
    // console.log('seed', seed);
    var state = `${seed}:`;
    switch (seed.slice(-1)) {
        case 0:
            state += `asdfasdf|`
            break;
        case 1:
            state += `qwerqwer|`
            break;
        case 2:
            state += `;klj;lk|`
            break;
        case 3:
            state += `lk|`
            break;
        case 4:
            state += `lk|`
            break;
        case 5:
            state += `lk|`
            break;
        case 6:
            state += `lk|`
            break;
        case 7:
            state += `lk|`
            break;
        case 8:
            state += `lk|`
            break;
        case 9:
            state += `lk|`
            break;
    }
    return { gen: worldSeed, data: state };
};

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
    this.getState = () => {
        // console.log('getstate', this.state.gen, worldseed);
        if (this.state.gen === worldSeed) {
            return this.state;
        } else {
            this.state = createState(this.seed);
            return this.state;
        }
    };
    return this;
};
router.post('/heartbeat', function(req, res, next) {
    var latLong = { lat: req.body.lat, long: req.body.long };
    var localStops = [];
    // to run a query we can acquire a client from the pool,
    // run a query on the client, and then return the client to the pool

    pool.connect(function(err, client, done) {
        if (err) {
            return console.error('error fetching client from pool', err);
        }
        client.query('select * from world_state where time = (select max(time) from world_state);', [], function(err, result) {
            console.log('worldstate', result.rows);
            done();
            // if world state doesnt' yet exist, or if it's older than a minute, 
            // create a new world state / seed.
            if (result.rows.length === 0 || result.rows[0].time < new Date().getTime() - 60000) {
                tickWorld(client, (worldSeed) => {
                    client.query('SELECT * FROM stops WHERE coordinates <-> point($1, $2) < 1;', [latLong.lat, latLong.long], function(err, result) {
                        //call `done()` to release the client back to the pool
                        done();

                        if (err) {
                            return console.error('error running query', err);
                        }
                        // if no spots, add a spot right where they're standing
                        if (result.rows.length === 0) {
                            var stop = new Stop(latLong.lat, latLong.long, false, worldSeed);
                            client.query('INSERT INTO stops (coordinates, seed, state) VALUES point($1, $2), $3, $4', [latLong.lat, latLong.long, stop.seed, stop.state], () => {
                                console.log('new spot created');
                                done();
                                localStops.push(stop);
                                res.send(localStops);
                            });
                        } else {
                            //otherwise, map results and get an array of stops to send to client
                            console.log(result.rows);
                            result.rows.map(stop => {
                                localStops.push(new Stop(stop.coordinates[0], stop.coordinates[1], stop.seed));
                            });
                            res.send(localStops);
                        }
                        // res.send(`this is an api ${result.rows[0].number}`);
                        //output: 1
                    });

                }, done);
            }

        });
    });
});

module.exports = function(dbPool) {
    pool = dbPool;
    return router;
};
