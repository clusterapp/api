var RedditWrapper = require('reddit-wrapper');
var async = require('async');
var ApiCache = require('../models/api_cache_model.js');
var request = require('request');


var cacheFn = function(options) {
  var queryString = "";
  if(Object.keys(options.request.qs).length > 0) {
    queryString += "?";
    var params = [];
    for(var key in options.request.qs) {
      params.push(key + '=' + options.request.qs[key]);
    }
    queryString += params.join('&');
  }
  var cacheKey = options.request.url + queryString;
  ApiCache.findOne({ url: cacheKey }, function(e, cache) {
    if(cache && cache.notExpired()) return options.callback(null, null, cache.data);

    request(options.request, function(err, resp, body) {
      if(err) throw(err);
      var jsonBody = JSON.parse(body);

      if(cache) {
        ApiCache.update({ url: cacheKey }, { date: Date.now(), data: jsonBody }, function() {
          options.callback(err, resp, jsonBody);
        });
      } else {
        new ApiCache({ url: cacheKey, data: jsonBody }).save(function(e, cache) {
          options.callback(err, resp, jsonBody);
        });
      }
    });
  });
};

var Listing = function(cluster) {
  this.wrap = new RedditWrapper({
    //TODO: try to figure out why the caching doesn't work
    cache: true,
    cacheFn: cacheFn
  });
  this.cluster = cluster;
};

Listing.prototype.get = function(opts, cb) {
  var results = { after: {} };
  async.each(this.cluster.subreddits, function(item, done) {
    var listingOpts = {
      subReddit: item
    }
    if(opts.query && opts.query['after_' + item]) {
      listingOpts.after = opts.query['after_' + item];
    }
    this.wrap.listing(listingOpts, function(e, resp, body) {
      results[item] = body;
      results.after[item] = body.data.after;
      done();
    });
  }.bind(this), function(err) {
    this._orderResults(results);
    cb(null, results);
  }.bind(this));
};

Listing.prototype._orderResults = function(results) {
  var ordered = [];
  var length = results[this.cluster.subreddits[0]].data.children.length;
  var subredditCount = this.cluster.subreddits.length;
  if(subredditCount === 1) {
    results.sorted = results[this.cluster.subreddits[0]].data.children.map(function(item) {
      return item.data;
    });
    return;
  }

  for(var i = 0; i < length; i++) {
    var items = [];
    // get the score for the ith item for each of the keys
    this.cluster.subreddits.forEach(function(subReddit) {
      var item = results[subReddit].data.children[i];
      if(item) items.push(item.data);
    });
    items.sort(function(a, b) {
      return b.score - a.score;
    }).forEach(function(i) {
      ordered.push(i);
    });
  }

  results.sorted = ordered;

}

module.exports = Listing;
