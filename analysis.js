"use strict";

var _ = require('underscore');
var moment = require('moment');
var redis = require('redis');
var request = require('request');

var redisClient = redis.createClient();

var getGameLog = function (gid, callback) {
  var logUrl = 'http://tenhou.net/5/mjlog2json.cgi?' + gid;
  var refererUrl = 'http://tenhou.net/5/?log=' + gid;
  request.get({
    url: logUrl,
    headers: {
      'Host': 'tenhou.net',
      'Referer': refererUrl
    }
  }, function (err, res, body) {
    if (err) {
      callback(err);
      return;
    }

    var jsonBody;
    try {
      jsonBody = JSON.parse(body)
    } catch (err) {
      callback(err);
      return;
    }

    callback(null, jsonBody);
  });
};

module.exports = function (gid, callback) {
  redisClient.get('game|' + gid, function (err, reply) {
    if (err) {
      callback(err);
      return;
    }
    if (reply) {
      callback('AlreadyExist');
      return;
    }

    getGameLog(gid, function (err, result) {
      if (err) {
        callback(err);
        return;
      }

      var game = {id: gid};

      game.players = result.name;

      game.result = [];
      var points = _.filter(result.sc, function (value, index) { return (index % 2) === 0; });
      _.each(points, function (point, index) {
        game.result.push({
          point: point,
          rank: points.concat().sort().reverse().indexOf(point) + 1,
          buttobi: point < 0
        });
      });

      game.kyokus = [];
      _.each(result.log, function (kyokuObj) {
        var kyokuInfo = {
          ba: ~~(kyokuObj[0][0] / 4), // 0: ton, 1: nan
          kyoku: kyokuObj[0][0] % 4 + 1,
          bonba: kyokuObj[0][1],
        };

        var lastElement = _.last(kyokuObj);
        var kyokuResult = {
          endType: lastElement[0],
          pointChange: lastElement[1]
        };

        if (kyokuResult.endType === '和了') {
          kyokuResult.agariType = lastElement[2][0] === lastElement[2][1] ? 0 : 1; // 0: tsumo, 1: ron
          kyokuResult.winner = lastElement[2][0];
          kyokuResult.victim = lastElement[2][1];
          kyokuResult.yaku = lastElement[2].slice(4);

          var pointRegex = /([\d\-]+)点∀?/;
          var parsedPoint = pointRegex.exec(lastElement[2][3]);

          var pointTen = parsedPoint[1];
          if (parsedPoint[0].indexOf('∀') >= 0) {
            pointTen = parseInt(pointTen, 10) * 3;
          } else if (parsedPoint[1].indexOf('-') >= 0) {
            var pointTens = pointTen.split('-');
            pointTen = parseInt(pointTens[0], 10) * 2 + parseInt(pointTens[1]);
          } else {
            pointTen = parseInt(pointTen, 10);
          }

          kyokuResult.point = {
            str: lastElement[2][3],
            han: lastElement[2][3].substring(0, parsedPoint.index),
            ten: pointTen
          };
        }

        game.kyokus.push({
          info: kyokuInfo,
          result: kyokuResult
        });
      });

      game.uploadDatetime = moment().format('YYYYMMDDHHmmss');

      redisClient.set('game|' + gid, JSON.stringify(game), function (err) {
        if (err) {
          callback(err);
        } else {
          callback(null, game);
        }
      });
    });
  });
};
