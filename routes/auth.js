// all these routes are nested under /auth

var express = require('express');
var crypto = require('crypto');
var passport = require('passport');
var _ = require('underscore');



// exports.logout = function(req, res) {
//   req.session.userid = null;
//   req.session.username = null;
//   req.logout();
//   res.redirect('/');
// };

var authRoutes = {
  '/reddit': {
    method: 'get',
    fn: function(req, res, next) {
      req.session.state = crypto.randomBytes(32).toString('hex');
      passport.authenticate('reddit', {
        state: req.session.state
      })(req, res, next);
    }
  },
  '/reddit/callback': {
    method: 'get',
    fn: function(req, res, next) {
      if (req.query.state == req.session.state){
        passport.authenticate('reddit', {
          successRedirect: '/auth/reddit/success',
          failureRedirect: '/auth/reddit/failure'
        })(req, res, next);
      } else {
        res.json({ authenticated: false });
      }
    }
  },
  '/reddit/success': {
    method: 'get',
    fn: function(req, res, next) {
      console.log(req.user);
      res.json(_.extend({ authenticated: true }, req.user._json));
    }
  },
  '/reddit/failure': {
    method: 'get',
    fn: function(req, res, next) {
      res.json({ authenticated: false });
    }
  }
};

var router = express.Router();

Object.keys(authRoutes).forEach(function(route) {
  router[authRoutes[route].method](route, authRoutes[route].fn);
});


module.exports = {
  router: router,
  endpoints: authRoutes
}
