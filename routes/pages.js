// all these routes are nested under /pages


var express = require('express');
var _ = require('underscore');
var RedditWrapper = require('reddit-wrapper');

var async = require('async');

var validateParamsExist = require('../lib/param_validator');

var ENDPOINTS = {};
['/users', '/clusters', '/reddit'].forEach(function(url) {
  ENDPOINTS[url] = require('.' + url);
});

var getMultipleRoutes = function(routes, req, res, cb) {
  var resp = {};
  async.each(routes, function(route, cb) {
    var parts = route.split('/').filter(function(r) { return r != ''; });
    var endpoint = ENDPOINTS['/' + parts[0]].endpoints['/' + _.rest(parts).join('/')];
    endpoint.fn(req, {
      json: function(d) {
        resp[route] = d;
        cb();
      }
    });
  }, function() {
    cb(resp);
  });
};

var pageRoutes = {
  '/index': {
    method: 'get',
    fn: function(req, res) {
      getMultipleRoutes(['/users/clusters/own', '/users/clusters/admin', '/users/clusters/subscribed'], req, res, function(result) {
        res.json(result);
      });
    }
  }
};

var router = express.Router();

Object.keys(pageRoutes).forEach(function(route) {
  router[pageRoutes[route].method](route, pageRoutes[route].fn);
});


module.exports = {
  router: router,
  endpoints: pageRoutes
}
