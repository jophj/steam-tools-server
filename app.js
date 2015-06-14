var express = require('express');
var request = require('request');
var steamAppInfo = require('./steam-app-info.js');

var app = express();

var HOST = 'api.steampowered.com';

app.set('port', (process.env.PORT || 3666));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


app.use('/info/:appid', function (req, res) {
  var appId = req.params.appid;
  
  steamAppInfo(appId).getInfo(function (appInfo) {
    res.send(appInfo);
  });
});

app.use('/', function (req, res) {
  request('https://' + HOST + req.originalUrl, function (err, response, body) {
    res.send(body);
  });
});

app.listen(app.get('port'), function() {
  console.log("App is running at localhost:" + app.get('port'));
});
