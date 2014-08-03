// all these routes are nested under /testing

var express = require('express');
var _ = require('underscore');
var User = require('../models/user_model');
var Cluster = require('../models/cluster_model');

var testRoutes = {
  '/delete_clusters': {
    method: 'get',
    fn: function(req, res) {
      if(!process.env.TEST_TOKEN || process.env.TEST_TOKEN == 'undefined') return res.json({ error: 'forbidden' });
      Cluster.remove({}, function() {
        res.json({ result: 'removed clusters' });
      });
    }
  }
};

var router = express.Router();

Object.keys(testRoutes).forEach(function(route) {
  router[testRoutes[route].method](route, testRoutes[route].fn);
});


module.exports = {
  router: router,
  endpoints: testRoutes
}
