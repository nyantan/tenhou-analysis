"use strict";

var _ = require('underscore');
var analysis = require('./analysis');
var async = require('async');
var express = require('express');
var moment = require('moment');
var redis = require('redis');
var translate = require('./translate');

var app = express();
var redisClient = redis.createClient();

app.set('view engine', 'jade');
app.use(express.static(__dirname + '/static'));
app.use(express.bodyParser());

app.get('/', function (req, res) {
  res.render('index', {
    pageTitle: '마작!'
  });
});

app.get('/game', function (req, res) {
  redisClient.keys('game|*', function (err, replies) {
    if (err) {
      res.send(500, {error: err});
      return;
    }

    redisClient.mget(replies, function (err, games) {
      if (err) {
        res.send(500, {error: err});
        return;
      }

      games = _.map(games, JSON.parse);

      games = _.sortBy(games, function (game) {
        var gameDatetime = game.id.substr(0, 10);
        return gameDatetime + game.uploadDatetime;
      }).reverse();

      res.json(_.map(games, function (game) {
        var simpleResult = {};
        simpleResult.id = game.id;
        simpleResult.players = game.players;
        simpleResult.result = game.result;
        simpleResult.uploadDatetime = moment(game.uploadDatetime, 'YYYYMMDDHHmmss').format('YYYY-MM-DD HH:mm');
        return simpleResult;
      }));
    });
  });
});

app.get('/game/:gid', function (req, res) {
  var gid = req.params.gid;
  if (!gid) {
    res.send(500, {error: "NoGid"});
    return;
  }

  redisClient.get('game|' + gid, function (err, game) {
    if (err) {
      res.send(500, {error: err});
      return;
    }

    if (!game) {
      res.send(500, {error: 'NotFound'});
      return;
    }

    game = JSON.parse(game);
    game.uploadDatetime = moment(game.uploadDatetime, 'YYYYMMDDHHmmss').format('YYYY-MM-DD HH:mm');
    game.kyokus = _.map(game.kyokus, function (kyoku) {
      if (kyoku.info.ba === 0) {
        kyoku.info.baStr = '東';
      } else if (kyoku.info.ba === 1) {
        kyoku.info.baStr = '南';
      } else if (kyoku.info.ba === 2) {
        kyoku.info.baStr = '西';
      } else if (kyoku.info.ba === 3) {
        kyoku.info.baStr = '北';
      }
      kyoku.info.oya = game.players[kyoku.info.kyoku - 1];

      if (kyoku.result.endType === translate('和了')) {
        kyoku.result.resultStr = '화료: ';
        if (kyoku.result.agariType === 0) {
          kyoku.result.resultStr += '쯔모 (' + game.players[kyoku.result.winner] + ')';
        } else {
          kyoku.result.resultStr += '론 (' + game.players[kyoku.result.winner] + ' -> ' + game.players[kyoku.result.victim] + ')';
        }
      } else {
        kyoku.result.resultStr = '유국';
      }

      return kyoku;
    });

    res.render('game', {
      pageTitle: '마작! - ' + gid,
      game: game
    });
  });
});

app.put('/game', function (req, res) {
  var gid = req.body.gid;
  var gidRegex = /^\w{10}gm-\w+-\w+-\w{8}$/;
  if (!gidRegex.exec(gid)) {
    res.send(500, {error: 'WrongGid'});
    return;
  }

  analysis(gid, function (err, result) {
    if (err) {
      res.send(500, {error: err});
    } else {
      res.json(result);
    }
  });
});

app.get('/user', function (req, res) {
  redisClient.keys('count|game|*', function (err, replies) {
    if (err) {
      res.send(500, {error: err});
      return;
    }

    var players = _.map(replies, function (reply) { return reply.split('|')[2]; });

    var playerStats = [];
    var getPlayerStat = function (players, index, callback) {
      var player = players[index];
      if (!player) {
        callback();
      } else {
        async.parallel({
          game: function (callback) { redisClient.get('count|game|' + player, callback); },
          rank1: function (callback) { redisClient.get('count|rank1|' + player, callback); },
          rank2: function (callback) { redisClient.get('count|rank2|' + player, callback); },
          rank3: function (callback) { redisClient.get('count|rank3|' + player, callback); },
          rank4: function (callback) { redisClient.get('count|rank4|' + player, callback); },
          point: function (callback) { redisClient.get('count|point|' + player, callback); },
          hora: function (callback) { redisClient.get('count|hora|' + player, callback); },
          kyoku: function (callback) { redisClient.get('count|kyoku|' + player, callback); },
          shot: function (callback) { redisClient.get('count|shot|' + player, callback); }
        },
        function (err, stat) {
          if (err) {
            res.send(500, {error: err});
            return;
          }

          _.each(stat, function (val, index) {
            if (!val) {
              stat[index] = 0;
            } else {
              stat[index] = parseInt(val, 10);
            }
          });

          stat.rankRate = +((stat.rank1 + 2 * stat.rank2 + 3 * stat.rank3 + 4 * stat.rank4) / stat.game).toFixed(2);
          stat.pointRate = +(stat.point / stat.game).toFixed(2);
          stat.rank1Rate = +(stat.rank1 / stat.game).toFixed(2);
          stat.rank2Rate = +(stat.rank2 / stat.game).toFixed(2);
          stat.rank3Rate = +(stat.rank3 / stat.game).toFixed(2);
          stat.rank4Rate = +(stat.rank4 / stat.game).toFixed(2);
          stat.horaRate = +(stat.hora / stat.kyoku).toFixed(2);
          stat.shotRate = +(stat.shot / stat.kyoku).toFixed(2);

          stat.nick = player;

          playerStats.push(stat);
          getPlayerStat(players, index + 1, callback);
        });
      }
    };

    getPlayerStat(players, 0, function () {
      res.render('user', {
        pageTitle: '마작! - 유저',
        data: JSON.stringify(playerStats)
      });
    });
  });
});

app.listen(2331);
