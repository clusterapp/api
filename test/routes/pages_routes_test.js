var expect = require('expect.js');
var pageRoutes = require('../../routes/pages').endpoints;
require('../shorter_stack_traces');
var nock = require('nock');
var mock = require('./mock_reddit_api.js');

var User = require('../../models/user_model');
var Cluster = require('../../models/cluster_model');

var callRoute = function(route, req, res) {
  pageRoutes[route].fn(req, res);
};

describe('page routes', function() {
  describe('/index', function() {
    it('merges multiple calls into one', function(done) {
      User.createWithToken({ redditName: 'jack' }, function(e, user) {
        new Cluster({ name: 'foo', owner: user }).save(function(e, cluster) {
          callRoute('/index', {
            query: { userId: user.id, token: user.token }
          }, {
            json: function(d) {
              expect(d['/users/clusters/own'].length).to.eql(1);
              done();
            }
          });
        });
      });
    });
  });
});
