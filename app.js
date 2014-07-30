var express = require('express');
var http = require('http');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

if(app.get('env') != 'test') {
  app.use(logger('dev'));
}
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
if(process.env.NODE_ENV === 'production') {
  app.use(session({
    store: new RedisStore({
      url: process.env.REDISTOGO_URL
    }),
    secret: 'keyboard cat',
    saveUninitialized: true,
    resave: true
  }));
} else {
  app.use(session({
    store: new RedisStore({
      host: "127.0.0.1",
      port: 6379,
      db: 2
    }),
    secret: 'keyboard cat',
    saveUninitialized: true,
    resave: true
  }));
}

require('./passport-config')(app);

// initialise all the routes
require('./routes')(app);

// development error handler
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.json({
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.json({ error: err.message });
});

module.exports = app;
