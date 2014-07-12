var RedditWrapper = require('reddit-wrapper');
var async = require('async');

var Listing = function(cluster) {
  this.wrap = new RedditWrapper({
    parseJson: true
  });
  this.cluster = cluster;
};

Listing.prototype.get = function(opts, cb) {
  var results = {};
  async.each(this.cluster.subreddits, function(item, done) {
    var listingOpts = {
      subReddit: item
    }
    if(opts.after && opts.after[item]) {
      listingOpts.after = opts.after[item];
    }
    this.wrap.listing(listingOpts, function(e, resp, body) {
      results[item] = body;
      done();
    });
  }.bind(this), function(err) {
    cb(null, results);
  });
};

module.exports = Listing;
