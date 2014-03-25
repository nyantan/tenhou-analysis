"use strict";

var analysis = require('./analysis');
var express = require('express');

var app = express();

app.set('view engine', 'jade');
app.use(express.static(__dirname + '/static'));
app.use(express.bodyParser());

app.get('/', function (req, res) {
  res.render('index', {
    pageTitle: '마작!'
  });
});

app.get('/game', function (req, res) {
});

app.put('/game', function (req, res) {
  var gid = req.body.gid;
  var gidRegex = /^\w{10}gm-\w{4}-\w{4}-\w{8}$/;
  if (!gidRegex.exec(gid)) {
    res.send(500);
    return;
  }

  analysis(gid, function (err, result) {
    if (err) {
      res.send(500, {error: err});
    } else {
      console.log(JSON.stringify(result));
      res.json({success: true});
    }
  });
});

app.listen(2331);
