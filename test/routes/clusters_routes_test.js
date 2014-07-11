var expect = require('expect.js');

var clusterRoutes = require('../../routes/clusters').endpoints;

var User = require('../../models/user_model');
var Cluster = require('../../models/cluster_model');

require('../test_db_config');

var timekeeper = require('timekeeper');

var callRoute = function(route, req, res) {
  clusterRoutes[route].fn(req, res);
};

describe('cluster routes', function() {
  describe('/', function() {
    it('returns the cluster', function(done) {
      User.createWithToken({ redditName: 'Jack' }, function(e, user) {
        new Cluster({ name: 'foo', owner: user }).save(function(e, cluster) {
          callRoute('/', {
            query: { id: cluster.id, token: user.token }
          }, {
            json: function(d) {
              expect(d.name).to.eql('foo');
              done();
            }
          });
        });
      });
    });
  });
});
