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

var processListing = function(opts, cb) {
  var cluster = opts.cluster;
  var after = opts.req.query.after;
  var fullUrl = opts.fullUrl;
  var skipCache = opts.req.query.SKIP_CACHE;
  var cache = opts.cache;

  new Listing(cluster).get({ after: after }, function(e, listing) {
    if(cache && cache.hasExpired()) {
      ListingCache.update({ url: fullUrl }, {
        date: Date.now(), data: listing
      }, function() {
        return cb(listing);
      });
    } else {
      if(!skipCache) {
        new ListingCache({ url: fullUrl, data: listing }).save(function(e, cache) {
          return cb(listing);
        });
      } else {
        return cb(listing);
      }
    }
  });
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
        var fullUrl;

        if(!req.query.SKIP_CACHE) {
          fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
        }

        Cluster.userHasPermission(req.query.userId, req.query.clusterId, function(hasPermission, cluster) {
          if(hasPermission) {
            ListingCache.findOne({ url: fullUrl }, function(e, cache) {
              if(cache && !cache.hasExpired()) {
                return res.json(_.extend(cache.data, { fromCache: true }));
              }

              // by this point, we know we dont have a cached instance
              processListing({
                cluster: cluster,
                req: req,
                fullUrl: fullUrl,
                cache: cache
              }, function(listing) {
                return res.json(listing);
              });
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
