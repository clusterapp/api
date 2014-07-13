var Cluster = require('../../models/cluster_model');
var User = require('../../models/user_model');
var expect = require('expect.js');
var async = require('async');

require('../test_db_config');
require('../shorter_stack_traces');

var twoUsers = function(done) {
  var users = [];
  async.each(['jack', 'ollie'], function(name, cb) {
    new User({ redditName: name }).save(function(e, user) {
      users.push(user);
      cb();
    });
  }, function() {
    done(users[0], users[1]);
  });
};

describe('Cluster model', function() {
  it('has an owner', function(done) {
    new User({ redditName: 'jack' }).save(function(e, user) {
      new Cluster({ name: 'foo', owner: user }).save(function(e, cluster) {
        expect(cluster.owner).to.eql(user._id);
        done();
      });
    });
  });


  describe('#clusterNameIsUnique', function() {
    it('returns false is name is used', function(done) {
      new User({ redditName: 'jack' }).save(function(e, user) {
        async.each(['foo', 'bar'], function(name, cb) {
          new Cluster({ name: name, owner: user }).save(cb);
        }, function(e) {
          Cluster.clusterNameIsUnique(user, 'foo', function(res) {
            expect(res).to.eql(false);
            done();
          });
        });
      });
    });

    it('returns true if name is unique', function(done) {
      new User({ redditName: 'jack' }).save(function(e, user) {
        async.each(['foo', 'bar'], function(name, cb) {
          new Cluster({ name: name, owner: user }).save(cb);
        }, function(e) {
          Cluster.clusterNameIsUnique(user, 'code', function(res) {
            expect(res).to.eql(true);
            done();
          });
        });
      });
    });

    it('is case insensitive', function(done) {
      new User({ redditName: 'jack' }).save(function(e, user) {
        async.each(['foo', 'bar'], function(name, cb) {
          new Cluster({ name: name, owner: user }).save(cb);
        }, function(e) {
          Cluster.clusterNameIsUnique(user, 'FOO', function(res) {
            expect(res).to.eql(false);
            done();
          });
        });
      });
    });
  });

  describe('#serialize', function() {
    it('only has the expected keys', function(done) {
      new User({ redditName: 'jack' }).save(function(e, user) {
        var cluster = new Cluster({ name: 'code', owner: user }).serialize();
        expect(Object.keys(cluster)).to.eql('public subreddits admins subscribers id name createdAt owner'.split(' '));
        done();
      });
    });
  });

  var newCluster = function(owner, cb) {
    new Cluster({ name: 'foo', owner: owner }).save(cb);
  };

  describe.only('#saveAdmin', function() {
    it('saves the admin', function(done) {
      twoUsers(function(user1, user2) {
        newCluster(user1, function(e, cluster) {
          cluster.saveAdmin(user2, function(e, cluster) {
            expect(cluster.admins).to.eql([user2]);
            done();
          });
        });
      });
    });
  });

  describe('.userHasPermission', function() {
    it('gives permission if cluster is public', function(done) {
      new User({ redditName: 'jack' }).save(function(e, user) {
        new Cluster({ name: 'foo', public: true, owner: user.id }).save(function(e, cluster) {
          Cluster.userHasPermission('53c00d6d6ccaa6cb091bec4f', cluster.id, function(res) {
            expect(res).to.be(true);
            done();
          });
        });
      });
    });


    it('does not gives perms when private if user is not admin or owner', function(done) {
      twoUsers(function(user1, user2) {
        new Cluster({ public: false, name: 'foo', owner: user2 }).save(function(e, cluster) {
          Cluster.userHasPermission(user1.id, cluster.id, function(res) {
            expect(res).to.be(false);
            done();
          });
        });
      });
    });

    it('deals with no user id', function(done) {
      new User({ redditName: 'jack' }).save(function(e, user) {
        new Cluster({ public: false, name: 'foo', owner: user.id }).save(function(e, cluster) {
          Cluster.userHasPermission(undefined, cluster.id, function(res) {
            expect(res).to.be(false);
            done();
          });
        });
      });
    });

    it('gives perms when private if user is admin', function(done) {
      twoUsers(function(user1, user2) {
        new Cluster({ name: 'foo', admins: [user2], owner: user1, public: false })
        .save(function(e, cluster) {
          Cluster.userHasPermission(user2.id, cluster.id, function(res) {
            expect(res).to.be(true);
            done();
          });
        });
      });
    });

    it('gives perms when private if user is owner', function(done) {
      new User({ redditName: 'jack' }).save(function(e, user) {
        new Cluster({ name: 'foo', owner: user, public: false }).save(function(e, cluster) {
          Cluster.userHasPermission(user.id, cluster.id, function(res) {
            expect(res).to.be(true);
            done();
          });
        });
      });
    });
  });
  describe('#ownedClusters', function() {
    it('returns a list of cluster ids for a user', function(done) {
      new User({ redditName: 'jack' }).save(function(e, user) {
        async.each(['foo', 'bar'], function(name, cb) {
          new Cluster({ name: name, owner: user }).save(cb);
        }, function(e) {
          Cluster.clustersForUser(user, function(e, clusters) {
            expect(clusters.map(function(c) { return c.name; }))
              .to.eql(['foo', 'bar']);
            done();
          });
        });
      });
    });
  });
});
