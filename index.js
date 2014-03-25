"use strict";

var analysis = require('./analysis');
var express = require('express');

var app = express();

app.set('view engine', 'jade');
app.use(express.static(__dirname + '/static'));

app.get('/', function (req, res) {
  res.render('index', {
    pageTitle: '마작!'
  });
});

app.listen(2331);
