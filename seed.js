var User = require('./models/user_model');
var Cluster = require('./models/cluster_model');
var ApiCache = require('./models/api_cache_model');
var ListingCache = require('./models/listing_cache_model');
var async = require('async');

var db = require('./database');


console.log('First, removing everything');

async.each([User, Cluster, ApiCache, ListingCache], function(c, cb) {
  c.remove({}, cb);
}, function() {
  var users = {};
  async.each(['jackfranklin', 'oj206', 'bob'], function(name, cb) {
    User.createWithToken({ redditName: name }, function(e, user) {
      console.log('CREATED USER:', user.redditName, 'ID:', user.id);
      users[name] = user;
      cb();
    });
  }, function() {
    var clusters = [
      new Cluster({name: 'coding', subreddits: ['vim', 'angularjs', 'swift'], owner: users.jackfranklin, admins: [users.oj206], public: true }),
      new Cluster({name: 'lol', subreddits: ['funny', 'tifu'], owner: users.oj206, admins: [], public: false }),
      new Cluster({name: 'football', subreddits: ['nufc', 'soccer'], owner: users.jackfranklin, admins: [], subscribers: [users.bob], public: true }),
      new Cluster({name: 'nerd', subreddits: ['apple', 'gaming'], owner: users.oj206, admins: [users.jackfranklin], subscribers: [users.bob], public: true }),
      new Cluster({name: 'talesfrom', subreddits: ['talesfromtechsupport', 'retail'], owner: users.oj206, admins: [], subscribers: [users.jackfranklin], public: true }),
    ];
    async.each(clusters, function(c, cb) {
      c.save(function(e, cluster) {
        console.log('CREATED CLUSTER:', cluster.name, 'OWNER:', cluster.owner, 'ADMINS', cluster.admins, 'SUBS', cluster.subscribers, 'PUBLIC:', cluster.public, 'SUBREDDITS', cluster.subreddits);
        cb();
      });
    }, function() {
      db.close();
    });
  });
});

