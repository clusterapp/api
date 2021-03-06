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
  var fullUrl = opts.fullUrl;
  var cache = opts.cache;

  new Listing(cluster).get({ query: opts.req.query}, function(e, listing) {
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

      validateParamsExist(['clusterId'], req, res, function(valid) {
        if(!valid) return;

        var fullUrl;
        if(!req.query.SKIP_CACHE) {
          fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
        }

        Cluster.userHasPermission(req.query.userId, req.query.clusterId, function(hasPermission, cluster) {
          if(!hasPermission) return res.json(ERRORS.NO_CLUSTER_FOUND());

          var listingFromCache = function(listing, fromCache) {
            // TODO: uncomment this
            if(!req.query.userId) {
              listing.after = {};
            }
            return _.extend(listing, { fromCache: fromCache });
          };

          if(req.query.SKIP_CACHE) {
            new Listing(cluster).get({ query: req.query }, function(e, listing) {
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
  '/cache_bust': {
    method: 'get',
    fn: function(req, res) {
      validateParamsExist(['userId', 'token', 'clusterId'], req, res, function(valid) {
        // http://127.0.0.1:3000/clusters/listing?clusterId=53d01b676cc9a200000a8d73&token=4a4623d38f3a665daa29ec3c554a9128f4065e52fcf84fd883c05bb7e198ee3d&userId=53d01b676cc9a200000a8d6e
        var url = req.protocol + '://' + req.get('host') + req.originalUrl;
        url = url.replace('cache_bust', 'listing');
        ListingCache.findOne({ url: url }, function(e, cache) {
          if(cache) {
            cache.remove(function() {
              res.json({ success: 'cache cleared' });
            })
          } else {
            res.json({ errors: ['no cache to clear'] });
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

        var updateCluster = function(cluster, data) {
          for(var key in data) {
            cluster[key] = data[key];
          }
          cluster.save(function(e, cluster) {
            if(e) return res.json(formatValidationErrors(e));
            cluster.serialize(res.json.bind(res));
          });
        };
        var onlyEditingSubscribers = function(cluster, body) {
          return (cluster.public === true && Object.keys(body).length === 1 && Object.keys(body)[0] === 'subscribers');
        };

        // we have to do this and not update because an update skips validations
        Cluster.findById(req.query.clusterId, function(e, cluster) {
          if(onlyEditingSubscribers(cluster, req.body) || cluster.userIdCanEdit(req.query.userId)) {
            return updateCluster(cluster, req.body);
          } else {
            return res.json({ errors: ['no permission to update cluster'] });
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
