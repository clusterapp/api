// all these routes are nested under /users

var express = require('express');
var User = require('../models/user_model');

var ERRORS = require('./error_messages');

var failOnParams = function(req, res) {
  var failed = false;
  if(!req.query || !req.query.id) {
    res.json(ERRORS.MISSING_PARAM('id'));
    failed = true;
  } else if(!req.query || !req.query.token || req.query.token != req.session.state) {
    res.json(ERRORS.INVALID_TOKEN());
    failed = true;
  } else if(req.query.id != req.session.userId) {
    res.json(ERRORS.INVALID_PARAM('id'));
    failed = true;
  };

  return failed;
};

var userRoutes = {
  '/': {
    method: 'get',
    fn: function(req, res) {
      if(failOnParams(req, res)) return;

      User.findOne({ _id: req.query.id }, function(e, user) {
        if(user) {
          res.json(user.serialize());
        } else {
          res.json(ERRORS.NO_USER_FOUND());
        }
      });
    }
  },
  '/updateLastActive': {
    method: 'post',
    fn: function(req, res) {
      if(failOnParams(req, res)) return;

      User.findById(req.query.id, function(e, user) {
        if(user) {
          user.updateLastActive(function(e, u) {
            res.json(u.serialize());
          });
        } else {
          res.json(ERRORS.NO_USER_FOUND());
        }
      });
    }
  }
};

var router = express.Router();

Object.keys(userRoutes).forEach(function(route) {
  router[userRoutes[route].method](route, userRoutes[route].fn);
});


module.exports = {
  router: router,
  endpoints: userRoutes
}
