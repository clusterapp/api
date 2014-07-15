var expect = require('expect.js');
var redditRoutes = require('../../routes/reddit').endpoints;
require('../shorter_stack_traces');
var nock = require('nock');
var mock = require('./mock_reddit_api.js');

var User = require('../../models/user_model');

var callRoute = function(route, req, res) {
  redditRoutes[route].fn(req, res);
};

describe('reddit routes', function() {
  describe('/popular', function() {
    it('lists the popular subreddits', function(done) {
      var pop = mock.withFile('/subreddits/popular.json?limit=10', 'test/routes/fixtures/popular.json');
      User.createWithToken({ redditName: 'jack' }, function(e, user) {
        callRoute('/popular', {
          query: { limit: 10, userId: user.id, token: user.token }
        }, {
          json: function(d) {
            expect(pop.isDone()).to.eql(true);
            expect(d[0].title).to.eql('funny');
            expect(d.length).to.eql(10);
            done();
          }
        });
      });
    });
  });
});
