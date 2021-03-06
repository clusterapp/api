// all these routes are nested under /auth

var express = require('express');
var crypto = require('crypto');
var passport = require('passport');
var _ = require('underscore');
var User = require('../models/user_model');
var ERRORS = require('../lib/error_messages');

var authRoutes = {
  '/test_stub_oauth': {
    method: 'get',
    fn: function(req, res) {
      if(!process.env.TEST_TOKEN || process.env.TEST_TOKEN == 'undefined') return res.json({ error: 'forbidden' });
      // basically have to create a new user, and then return just as if it was proper oauth
      authRoutes['/reddit/success'].fn({
        user: { name: req.query.name },
        session: { redirect: req.query.redirect }
      }, {
        redirect: function(data) {
          res.redirect(data);
        }
      });
    }
  },
  '/reddit': {
    method: 'get',
    fn: function(req, res, next) {
      if(!req.query || !req.query.redirect) {
        return res.json(ERRORS.MISSING_PARAM('redirect'));
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
      User.findOrCreate(req.user.name, function(e, user) {
        user.saveNewToken(function(e, user) {
          res.redirect(req.session.redirect +
                       '?user_id=' + user.id.toString() + '&user_name=' + user.redditName +
                       '&token=' + user.token + '&last_active=' + user.lastActive.toString());
        });
      });
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
