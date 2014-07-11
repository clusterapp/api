var Cluster = require('../../models/cluster_model');
var User = require('../../models/user_model');
var expect = require('expect.js');

require('../test_db_config');

describe('Cluster model', function() {
  it('has an owner', function(done) {
    new User({ redditName: 'jack' }).save(function(e, user) {
      new Cluster({ name: 'foo', owner: user }).save(function(e, cluster) {
        expect(cluster.owner).to.eql(user._id);
        done();
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

  describe('#userHasPermission', function() {
    it('gives permission if cluster is public', function(done) {
      new Cluster({ public: true }).save(function(e, cluster) {
        Cluster.userHasPermission('53c00d6d6ccaa6cb091bec4f', cluster.id, function(res) {
          expect(res).to.be(true);
          done();
        });
      });
    });


    it('does not gives perms when private if user is not admin or owner', function(done) {
      new User({ redditName: 'jack' }).save(function(e, user) {
        new Cluster({ public: false }).save(function(e, cluster) {
          Cluster.userHasPermission('53c00d6d6ccaa6cb091bec4f', cluster.id, function(res) {
            expect(res).to.be(false);
            done();
          });
        });
      });
    });

    it('deals with no user id', function(done) {
      new Cluster({ public: false }).save(function(e, cluster) {
        Cluster.userHasPermission(undefined, cluster.id, function(res) {
          expect(res).to.be(false);
          done();
        });
      });
    });

    it('gives perms when private if user is admin', function(done) {
      new User({ redditName: 'jack' }).save(function(e, user) {
        new Cluster({ name: 'foo', admins: [user], public: false }).save(function(e, cluster) {
          Cluster.userHasPermission(user.id, cluster.id, function(res) {
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
});
