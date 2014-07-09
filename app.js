var express = require('express');
var http = require('http');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var passport = require('passport');
var RedditStrategy = require('passport-reddit').Strategy;


var app = express();
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  store: new RedisStore({
    host: "127.0.0.1",
    port: 6379,
    db: 2
  }),
  secret: 'keyboard cat'
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

var authCodes = require('./keys.json');

var env = process.env.NODE_ENV || 'development';
console.log('ENV IS', env);
var callbackUrl = (env == 'development' ?
                   'http://127.0.0.1:3000/auth/reddit/callback' :
                   'http://192.241.141.125/auth/reddit/callback'
);

console.log(callbackUrl);

passport.use(new RedditStrategy({
  clientID: authCodes[env].redditKey,
  clientSecret: authCodes[env].redditSecret,
  callbackURL: callbackUrl
}, function(accessToken, refreshToken, profile, done) {
  console.log('passport args', arguments);
  return done(null, profile);
}));

// initialise all the routes
require('./routes')(app);

// development error handler
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;
