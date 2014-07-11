// all these routes are nested under /clusters

var express = require('express');
var ERRORS = require('./error_messages');
var User = require('../models/user_model');
var Cluster = require('../models/cluster_model');

ERRORS.NO_CLUSTER_FOUND = function() {
  return { error: 'no cluster found' }
};

var validateParams = function(req, res, cb) {
  if(!req.query || !req.query.id) {
    res.json(ERRORS.MISSING_PARAM('id'));
    return cb(false);
  } else if(!req.query || !req.query.token) {
    res.json(ERRORS.MISSING_PARAM('token'));
    return cb(false);
  } else {
    User.findOne({ token: req.query.token }, function(e, user) {
      if(e || !user) {
        res.json(ERRORS.INVALID_PARAM('token'));
        return cb(false);
      }
      return cb(true);
    });
  };
};

var clusterRoutes = {
  '/': {
    method: 'get',
    fn: function(req, res) {
      // todo: this behaviour will change if cluster is private
      validateParams(req, res, function(valid) {
        if(!valid) return;
        Cluster.findById(req.query.id, function(e, cluster) {
          if(cluster) {
            res.json(cluster.serialize());
          } else {
            res.json(ERRORS.NO_CLUSTER_FOUND());
          }
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
