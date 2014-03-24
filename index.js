"use strict";

var analysis = require('./analysis');

analysis('2014032400gm-0009-2331-cb3791c2', function (err, result) {
  if (err) {
    return;
  }
  console.log(JSON.stringify(result));
});
