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
    it('errors if no id given', function(done) {
      callRoute('/', { query: {} }, {
        json: function(d) {
          expect(d).to.eql({ errors: [ 'parameter clusterId is required', 'parameter token is required' ] });
          done();
        }
      });
    });

    it('errors if the token is invalid', function(done) {
      User.createWithToken({ redditName: 'Jack' }, function(e, user) {
        new Cluster({ name: 'foo', owner: user }).save(function(e, cluster) {
          callRoute('/', {
            query: { clusterId: cluster.id, token: '12345' }
          }, {
            json: function(d) {
              expect(d).to.eql({ errors: ['parameter: token is not valid'] });
              done();
            }
          });
        });
      });
    });

    it('does not return a private cluster if userId is not owner or admin', function(done) {
      User.createWithToken({ redditName: 'Jack' }, function(e, jack) {
        User.createWithToken({ redditName: 'ollie' }, function(e, ollie) {
          new Cluster({ name: 'foo', owner: jack, public: false }).save(function(e, cluster) {
            callRoute('/', {
              query: { clusterId: cluster.id, token: ollie.token, userId: ollie.id }
            }, {
              json: function(d) {
                expect(d).to.eql({ errors: ['no cluster found'] });
                done();
              }
            });
          });
        });
      });
    });

    it('returns a private cluster if userId matches', function(done) {
      User.createWithToken({ redditName: 'Jack' }, function(e, user) {
        new Cluster({ name: 'foo', owner: user, public: false }).save(function(e, cluster) {
          callRoute('/', {
            query: { clusterId: cluster.id, token: user.token, userId: user.id }
          }, {
            json: function(d) {
              expect(d.name).to.eql('foo');
              done();
            }
          });
        });
      });
    });

    it('returns the cluster', function(done) {
      User.createWithToken({ redditName: 'Jack' }, function(e, user) {
        new Cluster({ name: 'foo', owner: user }).save(function(e, cluster) {
          callRoute('/', {
            query: { clusterId: cluster.id, token: user.token }
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
