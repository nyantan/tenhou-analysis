"use strict";

var _ = require('underscore');
var analysis = require('./analysis');
var express = require('express');
var moment = require('moment');
var redis = require('redis');

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

app.listen(2331);
