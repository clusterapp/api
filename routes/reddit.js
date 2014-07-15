// all these routes are nested under /reddit

var express = require('express');
var _ = require('underscore');
var RedditWrapper = require('reddit-wrapper');

var wrap = new RedditWrapper({});
var validateParamsExist = require('./param_validator');

var redditRoutes = {
  '/popular': {
    method: 'get',
    fn: function(req, res) {
      validateParamsExist(['userId', 'token'], req, res, function(valid) {
        if(!valid) return;
        wrap.subreddits({ limit: req.query.limit }, function(e, r, resp) {
          res.json(resp.data.children.map(function(item) {
            return item.data;
          }));
        });
      });
    }
  }
};

var router = express.Router();

Object.keys(redditRoutes).forEach(function(route) {
  router[redditRoutes[route].method](route, redditRoutes[route].fn);
});


module.exports = {
  router: router,
  endpoints: redditRoutes
}
