var passport = require('passport');
var RedditStrategy = require('passport-reddit').Strategy;

module.exports = function(app) {
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser(function(user, done) {
    done(null, user);
  });

  passport.deserializeUser(function(obj, done) {
    done(null, obj);
  });

  if(process.env.NODE_ENV && process.env.NODE_ENV == 'test') {
    var authCodes = {};
    authCodes.test = {
      redditKey: 'baZ1VtnPyWCQNA',
      redditSecret: 'JIqQAUjIlJf1cGKoFOsTlh-fWHA'
    }
  } else {
    var authCodes = require('./keys.json');
  }

  var env = process.env.NODE_ENV || 'development';
  var callbackUrl = (env == 'development' || env == 'test' ?
                     'http://127.0.0.1:3000/auth/reddit/callback' :
                     'http://192.241.141.125/auth/reddit/callback'
  );

  passport.use(new RedditStrategy({
    clientID: authCodes[env].redditKey,
    clientSecret: authCodes[env].redditSecret,
    callbackURL: callbackUrl
  }, function(accessToken, refreshToken, profile, done) {
    return done(null, profile);
  }));
};
