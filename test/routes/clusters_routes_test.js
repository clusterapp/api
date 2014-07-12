var expect = require('expect.js');

var clusterRoutes = require('../../routes/clusters').endpoints;

var User = require('../../models/user_model');
var Cluster = require('../../models/cluster_model');

require('../test_db_config');

var timekeeper = require('timekeeper');
var mock = require('./mock_reddit_api.js');

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

  describe.only('/listing', function() {
    it('uses the after parameters if passed', function(done) {
      var vimMock = mock('/r/vim/hot.json?after=foo');
      var angularjsMock = mock('/r/angularjs/hot.json?after=bar');
      createUserAndCluster({
        user: { redditName: 'jack' },
        cluster: { name: 'foo', subreddits: ['vim', 'angularjs'] }
      }, function(user, cluster) {
        callRoute('/listing', {
          query: {
            userId: user.id,
            token: user.token,
            clusterId: cluster.id,
            after: { vim: 'foo', angularjs: 'bar' }
          }
        }, {
          json: function(d) {
            expectMocksToBeCalled(vimMock, angularjsMock);
            done();
          }
        });
      });
    });

    it('only uses after params if they are there', function(done) {
      var vimMock = mock('/r/vim/hot.json?after=foo');
      var angularjsMock = mock('/r/angularjs/hot.json');
      createUserAndCluster({
        user: { redditName: 'jack' },
        cluster: { name: 'foo', subreddits: ['vim', 'angularjs'] }
      }, function(user, cluster) {
        callRoute('/listing', {
          query: {
            userId: user.id,
            token: user.token,
            clusterId: cluster.id,
            after: { vim: 'foo' }
          }
        }, {
          json: function(d) {
            expectMocksToBeCalled(vimMock, angularjsMock);
            done();
          }
        });
      });
    });


    it('hits the end points for each subreddit', function(done) {
      var vimMock = mock('/r/vim/hot.json');
      var angularjsMock = mock('/r/angularjs/hot.json');
      var wtfMock = mock('/r/wtf/hot.json');
      createUserAndCluster({
        user: { redditName: 'jack' },
        cluster: { name: 'foo', subreddits: ['vim', 'angularjs', 'wtf'] }
      }, function(user, cluster) {
        callRoute('/listing', {
          query: { userId: user.id, token: user.token, clusterId: cluster.id }
        }, {
          json: function(d) {
            expectMocksToBeCalled(vimMock, angularjsMock, wtfMock)
            done();
          }
        });
      });
    });
  });

  var expectMocksToBeCalled = function() {
    var args = Array.prototype.slice.call(arguments);
    args.forEach(function(m) {
      expect(m.isDone()).to.be(true);
    });
  }

  var createUserAndCluster = function(opts, cb) {
    User.createWithToken(opts.user, function(e, user) {
      opts.cluster.owner = user;
      new Cluster(opts.cluster).save(function(e, cluster) {
        cb(user, cluster);
      });
    });
  };

});
