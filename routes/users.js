// all these routes are nested under /users

var express = require('express');
var User = require('../models/user_model');
var Cluster = require('../models/cluster_model');

var ERRORS = require('./error_messages');

var validateParamsExist = require('./param_validator');

var validateParams = function(req, res, cb) {
  if(!req.query || !req.query.id) {
    res.json(ERRORS.MISSING_PARAM('id'));
    return cb(false);
  } else if(!req.query || !req.query.token) {
    res.json(ERRORS.MISSING_PARAM('token'));
    return cb(false);
  } else {
    User.tokenIsValid(req.query.id, req.query.token, function(e, valid) {
      if(!valid) {
        res.json(ERRORS.INVALID_PARAM('id'));
        return cb(false);
      } else {
        return cb(true);
      }
    });
  };

};

var userRoutes = {
  '/': {
    method: 'get',
    fn: function(req, res) {
      validateParamsExist(['userId', 'token'], req, res, function(valid) {
        if(!valid) return;
        User.findOne({ _id: req.query.userId }, function(e, user) {
          if(user) {
            res.json(user.serialize());
          } else {
            res.json(ERRORS.NO_USER_FOUND());
          }
        });
      });
    }
  },
  '/updateLastActive': {
    method: 'post',
    fn: function(req, res) {
      validateParamsExist(['userId', 'token'], req, res, function(valid) {
        if(!valid) return;
        User.findById(req.query.userId, function(e, user) {
          if(user) {
            user.updateLastActive(function(e, u) {
              res.json(u.serialize());
            });
          } else {
            res.json(ERRORS.NO_USER_FOUND());
          }
        });
      });
    }
  },
  '/destroyToken': {
    method: 'post',
    fn: function(req, res) {
      validateParamsExist(['userId', 'token'], req, res, function(valid) {
        if(!valid) return;
        User.findById(req.query.userId, function(e, user) {
          user.token = undefined;
          user.save(function(e, user) {
            res.json({ success: 'token destroyed' });
          });
        });
      });
    }
  },
  '/clusters/own': {
    method: 'get',
    fn: function(req, res) {
      validateParamsExist(['userId', 'token'], req, res, function(valid) {
        if(!valid) return;
        Cluster.clustersForUserId(req.query.userId, function(e, clusters) {
          res.json(clusters);
        });
      });
    }
  },
  '/clusters/admin': {
    method: 'get',
    fn: function(req, res) {
      validateParamsExist(['userId', 'token'], req, res, function(valid) {
        if(!valid) return;
        Cluster.find({
          admins: { $in: [req.query.userId] }
        }, function(e, clusters) {
          res.json(clusters.map(function(c) { return c.serialize(); }));
        })
      });
    }
  },
  '/clusters/subscriber': {
    method: 'get',
    fn: function(req, res) {
      validateParamsExist(['userId', 'token'], req, res, function(valid) {
        if(!valid) return;
        Cluster.find({
          subscribers: { $in: [req.query.userId] }
        }, function(e, clusters) {
          res.json(clusters.map(function(c) { return c.serialize(); }));
        })
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
