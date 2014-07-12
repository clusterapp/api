// all these routes are nested under /clusters

var express = require('express');
var ERRORS = require('./error_messages');
var User = require('../models/user_model');
var Cluster = require('../models/cluster_model');
var validateParamsExist = require('./param_validator');

ERRORS.NO_CLUSTER_FOUND = function() {
  return { errors: [ 'no cluster found' ] }
};

var clusterRoutes = {
  '/': {
    method: 'get',
    fn: function(req, res) {
      // todo: this behaviour will change if cluster is private
      validateParamsExist(['clusterId', 'token'], req, res, function(valid) {
        if(!valid) return;
        Cluster.userHasPermission(req.query.userId, req.query.clusterId, function(hasPermission, cluster) {
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
