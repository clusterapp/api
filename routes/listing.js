var RedditWrapper = require('reddit-wrapper');
var async = require('async');

var Listing = function(cluster) {
  this.wrap = new RedditWrapper({
    parseJson: true
  });
  this.cluster = cluster;
};

Listing.prototype.get = function(opts, cb) {
  var results = { after: {} };
  async.each(this.cluster.subreddits, function(item, done) {
    var listingOpts = {
      subReddit: item
    }
    if(opts.after && opts.after[item]) {
      listingOpts.after = opts.after[item];
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
    results.sorted = results[this.cluster.subreddits[0]].data.children;
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
