// all these routes are nested under /clusters

var express = require('express');
var _ = require('underscore');
var ERRORS = require('./error_messages');
var User = require('../models/user_model');
var Cluster = require('../models/cluster_model');
var ListingCache = require('../models/listing_cache_model');
var validateParamsExist = require('./param_validator');
var Listing = require('./listing');

ERRORS.NO_CLUSTER_FOUND = function() {
  return { errors: [ 'no cluster found' ] }
};

var formatValidationErrors = function(e) {
  if(e) {
    var errors = [];
    for(var key in e.errors) {
      errors.push(e.errors[key].message);
    };
    return { errors: errors };
  }
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
        //TODO: test for SKIP_CACHE
        var needToCache, fullUrl;
        if(!req.SKIP_CACHE) {
          fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
          //TODO: if cache already exists, use it instead of doing the stuff below
          needToCache = true;
        } else {
          needToCache = false;
        }

        Cluster.userHasPermission(req.query.userId, req.query.clusterId, function(hasPermission, cluster) {
          if(hasPermission) {
            ListingCache.findOne({ url: fullUrl }, function(e, cache) {
              if(cache) {
                return res.json(_.extend(cache.data, { fromCache: true }));
              } else {
                new Listing(cluster).get({ after: req.query.after }, function(e, listing) {
                  if(needToCache) {
                    new ListingCache({ url: fullUrl, data: listing }).save(function(e, cache) {
                      res.json(listing);
                    });
                  } else {
                    res.json(listing);
                  }
                });
              }
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
          if(e) return res.json(formatValidationErrors(e));
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
          if(!cluster.userIdCanEdit(req.query.userId)) {
            return res.json({ errors: ['no permission to update cluster'] });
          }
          for(var key in req.body) {
            cluster[key] = req.body[key];
          }
          cluster.save(function(e, cluster) {
            if(e) return res.json(formatValidationErrors(e));
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
