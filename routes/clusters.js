// all these routes are nested under /clusters

var express = require('express');
var ERRORS = require('./error_messages');
var User = require('../models/user_model');
var Cluster = require('../models/cluster_model');
var validateParamsExist = require('./param_validator');
var Listing = require('./listing');

ERRORS.NO_CLUSTER_FOUND = function() {
  return { errors: [ 'no cluster found' ] }
};

var clusterRoutes = {
  '/': {
    method: 'get',
    fn: function(req, res) {
      validateParamsExist(['clusterId'], req, res, function(valid) {
        if(!valid) return;
        Cluster.userHasPermission(req.query.userId, req.query.clusterId, function(hasPermission, cluster) {
          res.json(hasPermission ? cluster.serialize() : ERRORS.NO_CLUSTER_FOUND());
        });
      });
    }
  },
  '/listing': {
    method: 'get',
    fn: function(req, res) {
      validateParamsExist(['userId', 'token', 'clusterId'], req, res, function(valid) {
        if(!valid) return;
        Cluster.userHasPermission(req.query.userId, req.query.clusterId, function(hasPermission, cluster) {
          if(hasPermission) {
            new Listing(cluster).get({ after: req.query.after }, function(e, listing) {
              res.json(listing);
            });
          } else {
            res.json(ERRORS.NO_CLUSTER_FOUND());
          }
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
            var errors = [];
            for(var key in e.errors) {
              errors.push(e.errors[key].message);
            };
            return res.json({ errors: errors });
          }
          res.json(cluster.serialize());
        });
      });
    }
  },
  '/update': {
    method: 'post',
    fn: function(req, res) {
      validateParamsExist(['userId', 'token', 'clusterId'], req, res, function(valid) {
        if(!valid) return;
        // we have to do this and not update because an update skips validations
        Cluster.findById(req.query.clusterId, function(e, cluster) {
          for(var key in req.body) {
            cluster[key] = req.body[key];
          }
          cluster.save(function(e, cluster) {
            if(e) {
              var errors = [];
              for(var key in e.errors) {
                errors.push(e.errors[key].message);
              };
              return res.json({ errors: errors });
            }

            res.json(cluster.serialize());
          });
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
