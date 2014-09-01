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

  var authCodes = {
    redditKey: process.env.REDDIT_KEY,
    redditSecret: process.env.REDDIT_SECRET
  }

  if(process.env.NODE_ENV === 'test') {
    authCodes = {
      redditKey: 'baZ1VtnPyWCQNA',
      redditSecret: 'JIqQAUjIlJf1cGKoFOsTlh-fWHA'
    }
  }

  var env = process.env.NODE_ENV || 'development';
  var callbackUrl = (env == 'development' || env == 'test' ?
                     'http://127.0.0.1:3000/auth/reddit/callback' :
                     'http://clusterit.me/auth/reddit/callback'
  );

  passport.use(new RedditStrategy({
    clientID: authCodes.redditKey,
    clientSecret: authCodes.redditSecret,
    callbackURL: callbackUrl
  }, function(accessToken, refreshToken, profile, done) {
    return done(null, profile);
  }));
};
