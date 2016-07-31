var express = require('express');
var router = express.Router();
var pool;
/* GET home page. */
router.get('/', function(req, res, next) {
    // to run a query we can acquire a client from the pool,
    // run a query on the client, and then return the client to the pool
    pool.connect(function(err, client, done) {
        if (err) {
            return console.error('error fetching client from pool', err);
        }
        // sample query; need to pass pool into app somehow.
        client.query('SELECT $1::int AS number', ['1'], function(err, result) {
            //call `done()` to release the client back to the pool
            done();

            if (err) {
                return console.error('error running query', err);
            }
            console.log(result.rows[0].number);
            res.send(`this is an api ${result.rows[0].number}`);
            //output: 1
        });
    });
});

module.exports = function(dbPool) {
    pool = dbPool;
    return router;
};
