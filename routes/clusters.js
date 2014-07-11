// all these routes are nested under /clusters

var express = require('express');
var async = require('async');
var ERRORS = require('./error_messages');
var User = require('../models/user_model');
var Cluster = require('../models/cluster_model');

ERRORS.NO_CLUSTER_FOUND = function() {
  return { error: 'no cluster found' }
};

ERRORS.USER_PERMISSIONS_WRONG = function() {
  return { error: 'user does not have permission to view cluster' }
};

var validateParamsExist = function(params, req, res, cb) {
  if(!req.query) {
    res.json({ errors: ['no parameters supplied'] });
    return cb(false);
  } else {
    var errors = [];
    async.each(params, function(p, callback) {
      if(!req.query[p]) {
        errors.push('parameter ' + p + ' is required');
        callback();
      } else {
        if(p === 'token' && req.query.token) {
          if(params.indexOf('userId') > -1 && req.query.userId) {
            User.findOne({ token: req.query.token, id: req.query.userId }, function(e, user) {
              if(e || !user) errors.push('parameter: token is not valid');
              callback();
            });
          } else {
            User.findOne({ token: req.query.token }, function(e, user) {
              if(e || !user) errors.push('parameter: token is not valid');
              callback();
            });
          }
        } else { callback(); }
      }
    }, function(err) {
      if(errors.length > 0) {
        res.json({ errors: errors });
        return cb(false);
      } else {
        return cb(true);
      }
    });
  };
}

var clusterRoutes = {
  '/': {
    method: 'get',
    fn: function(req, res) {
      // todo: this behaviour will change if cluster is private
      validateParamsExist(['id', 'token'], req, res, function(valid) {
        if(!valid) return;
        Cluster.userHasPermission(req.query.userId, req.query.id, function(hasPermission, cluster) {
          res.json(hasPermission ? cluster.serialize() : ERRORS.NO_CLUSTER_FOUND());
        });
      });
    }
  },
  '/create': {
    method: 'post',
    fn: function(req, res) {
      validateParamsExist(['userId', 'token'], req, res, function(valid) {
        if(!valid) return;
        new Cluster(req.body).save(function(e, cluster) {
          if(e) {
            return res.json({ error: e.message });
          }
          res.json(cluster.serialize());
        });
      });
    }
  }
};

var router = express.Router();

Object.keys(clusterRoutes).forEach(function(route) {
  router[clusterRoutes[route].method](route, clusterRoutes[route].fn);
});


module.exports = {
  router: router,
  endpoints: clusterRoutes
}
