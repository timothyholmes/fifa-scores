'use strict';

const Bluebird = require('bluebird'),
    PgPromise = require('pg-promise')({
        promiseLib: Bluebird
    });

module.exports.connection = PgPromise({
    user: 'root',
    host: 'localhost',
    database: (process.env.ENV === 'prod') ? 'olympia' : 'olympia_dev',
    port: '26257'
});

module.exports.findAll = require('./findAll');
module.exports.findSome = require('./findSome');
module.exports.insert = require('./insert');
module.exports.update = require('./update');
module.exports.combineObjectsWithNumericalValues = require('./combineObjectsWithNumericalValues');
