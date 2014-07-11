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
});
