// all these routes are nested under /auth

var express = require('express');
var crypto = require('crypto');
var passport = require('passport');
var _ = require('underscore');

var authRoutes = {
  '/reddit': {
    method: 'get',
    fn: function(req, res, next) {
      if(!req.query || !req.query.redirect) {
        return res.json({ error: 'No redirect param given' });
      };

      req.session.redirect = req.query.redirect;
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
      req.session.userName = req.user.name;
      res.redirect(req.session.redirect + '?data=' + req.user._raw + '&token=' + req.session.state);
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
