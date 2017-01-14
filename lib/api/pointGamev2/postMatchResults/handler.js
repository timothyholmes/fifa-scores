'use strict';

const Data = require('../../../data/'),
    _ = require('lodash'),
    Bluebird = require('bluebird');

let internals = {};

module.exports.recordMatch = (payload) => {
    let matchStatus,
        defaults,
        matchInfo = _.clone(payload),
        globalAdditions = {};

    globalAdditions[matchInfo.game] = {};

    matchInfo.date = Date.now();

    return Data.Insert.insertToMongo(matchInfo, 'matchResults')
    .then((response) => {
        return Bluebird.map(matchInfo.players, (player) => {
            let findOptions = {
                    name: player.name
                },
                newStats;

            return Data.Find.pullFromMongo(findOptions, 'players')
            .then((response) => {
                newStats = _.clone(response.result[0]) || {};

                if (!newStats[matchInfo.game]) {
                    newStats[matchInfo.game] = {};
                }

                newStats[matchInfo.game][player.placement] = _.get(newStats, matchInfo.game + '.' + player.placement, 0) + 1;

                return Bluebird.map(player.points, (e) => {
                    newStats[matchInfo.game][e.label] = _.get(newStats, matchInfo.game + '.' + e.label, 0) + e.value;
                    globalAdditions[matchInfo.game][e.label] = _.get(globalAdditions, matchInfo.game + '.' + e.label, 0) + e.value;
                });
            }).then(() => {
                return Data.Update.updateRecord(findOptions, newStats, 'players');
            });
        });
    }).then(() => {
        return Data.Find.pullFromMongo({}, 'globalStats');
    }).then((response) => {
        let globalData = _.clone(response.result[0]) || {};

        if (_.isEqual(globalData, {})) {
            globalAdditions[matchInfo.game]['matchesPlayed'] = matchInfo.players.length;

            return Data.Insert.insertToMongo(globalAdditions, 'globalStats');
        }

        if (!globalData[matchInfo.game]) {
            globalData[matchInfo.game] = {};
        }

        Object.keys(globalAdditions[matchInfo.game]).forEach((e) => {
            globalData[matchInfo.game][e] = globalAdditions[matchInfo.game][e] + _.get(globalData, matchInfo.game + '.' + e, 0);
        });

        globalData[matchInfo.game]['matchesPlayed'] = matchInfo.players.length + _.get(globalData, matchInfo.game + '.matchesPlayed', 0);

        return Data.Update.updateRecord({}, globalData, 'globalStats');
    }).catch((err) => {

        console.log('Error! ', err);
    });
};