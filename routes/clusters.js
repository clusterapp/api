// all these routes are nested under /clusters

var express = require('express');
var _ = require('underscore');
var ERRORS = require('../lib/error_messages');
var User = require('../models/user_model');
var Cluster = require('../models/cluster_model');
var ListingCache = require('../models/listing_cache_model');
var validateParamsExist = require('../lib/param_validator');
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

var writeCacheAndGetListing = function(opts, cb) {
  var cluster = opts.cluster;
  var after = opts.req.query.after;
  var fullUrl = opts.fullUrl;
  var cache = opts.cache;

  new Listing(cluster).get({ after: after }, function(e, listing) {
    if(cache) {
      ListingCache.update({ url: fullUrl }, {
        date: Date.now(), data: listing
      }, function() {
        return cb(listing);
      });
    } else {
      new ListingCache({ url: fullUrl, data: listing }).save(function(e, cache) {
        return cb(listing);
      });
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
          if(hasPermission) {
            cluster.serialize(res.json.bind(res));
          } else {
            res.json(ERRORS.NO_CLUSTER_FOUND());
          }
        });
      });
    }
  },
  '/name': {
    method: 'get',
    fn: function(req, res) {
      validateParamsExist(['clusterRoute'], req, res, function(valid) {
        if(!valid) return;
        var parts = req.query.clusterRoute.split('/').filter(function(item) { return item !== ''; });
        var userName = parts[0];
        var clusterName = parts[1];
        User.findOne({ redditName: userName }, function(e, user) {
          Cluster.findOne({ owner: user, name: clusterName }, function(e, cluster) {
            if(!cluster) return res.json(ERRORS.NO_CLUSTER_FOUND());
            Cluster.userHasPermission(req.query.userId, cluster.id, function(hasPermission, cluster) {
              if(hasPermission) {
                cluster.serialize(res.json.bind(res));
              } else {
                res.json(ERRORS.NO_CLUSTER_FOUND());
              }
            });
          });
        });
      });
    }
  },
  '/public': {
    method: 'get',
    fn: function(req, res) {
      Cluster.find({ public: true }, function(e, clusters) {
        if(clusters) {
          Cluster.serializeList(clusters, res.json.bind(res));
        } else {
          res.json(ERRORS.NO_CLUSTER_FOUND());
        }
      });
    }
  },
  '/listing': {
    method: 'get',
    fn: function(req, res) {

      validateParamsExist(['userId', 'token', 'clusterId'], req, res, function(valid) {
        if(!valid) return;

        var fullUrl;
        if(!req.query.SKIP_CACHE) {
          fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
        }

        Cluster.userHasPermission(req.query.userId, req.query.clusterId, function(hasPermission, cluster) {
          if(!hasPermission) return res.json(ERRORS.NO_CLUSTER_FOUND());

          var listingFromCache = function(listing, fromCache) {
            return _.extend(listing, { fromCache: fromCache });
          };

          if(req.query.SKIP_CACHE) {
            new Listing(cluster).get({ after: after }, function(e, listing) {
              return res.json(listingFromCache(listing, false));
            });
            return;
          }

          ListingCache.findOne({ url: fullUrl }, function(e, cache) {
            if(cache && cache.notExpired()) {
              return res.json(listingFromCache(cache.data, true));
            }

            // by this point, we know we dont have a cached instance
            writeCacheAndGetListing({
              cluster: cluster,
              req: req,
              fullUrl: fullUrl,
              cache: cache
            }, function(listing) {
              return res.json(listingFromCache(listing, false));
            });
          });
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
          cluster.serialize(res.json.bind(res));
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
            cluster.serialize(res.json.bind(res));
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
