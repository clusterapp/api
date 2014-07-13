var expect = require('expect.js');

var clusterRoutes = require('../../routes/clusters').endpoints;
require('../shorter_stack_traces');

var User = require('../../models/user_model');
var Cluster = require('../../models/cluster_model');

require('../test_db_config');

var timekeeper = require('timekeeper');
var mock = require('./mock_reddit_api.js');

var callRoute = function(route, req, res) {
  clusterRoutes[route].fn(req, res);
};

describe('cluster routes', function() {
  describe('/create', function() {
    it('creates a cluster', function(done) {
      User.createWithToken({ redditName: 'jack' }, function(e, user) {
        callRoute('/create', {
          query: { userId: user.id, token: user.token },
          body: { owner: user.id, name: 'foo' }
        }, {
          json: function(d) {
            expect(d.name).to.eql('foo');
            done();
          }
        });
      });
    });

    it('doesnt allow non unique names', function(done) {
      User.createWithToken({ redditName: 'jack' }, function(e, user) {
        new Cluster({ owner: user.id, name: 'foo' }).save(function(e, cluster) {
          callRoute('/create', {
            query: { userId: user.id, token: user.token },
            body: { owner: user.id, name: 'foo' }
          }, {
            json: function(d) {
              expect(d).to.eql({
                errors: [ 'cluster name is not unique' ]
              });
              done();
            }
          });
        });
      });
    });
  });

  describe('/', function() {
    it('errors if no id given', function(done) {
      callRoute('/', { query: {} }, {
        json: function(d) {
          expect(d).to.eql({ errors: [ 'parameter clusterId is required' ] });
          done();
        }
      });
    });

    it('errors if given a token and a user id that do not match', function(done) {
      User.createWithToken({ redditName: 'jack' }, function(e, user) {
        new Cluster({ name: 'foo', owner: user }).save(function(e, cluster) {
          callRoute('/', {
            query: { clusterId: cluster.id, userId: user.id, token: '12345' }
          }, {
            json: function(d) {
              expect(d).to.eql({ errors: ['parameter: token is not valid'] });
              done();
            }
          });
        });
      });
    });

    it('errors if the token is invalid', function(done) {
      User.createWithToken({ redditName: 'jack' }, function(e, user) {
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

    it('allows access with no token if cluster is public', function(done) {
      User.createWithToken({ redditName: 'jack' }, function(e, user) {
        new Cluster({ name: 'foo', owner: user }).save(function(e, cluster) {
          callRoute('/', {
            query: { clusterId: cluster.id }
          }, {
            json: function(d) {
              expect(d.name).to.eql('foo');
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

  describe('/listing', function() {
    it('returns the data for a valid request', function(done) {
      mock.withFile('/r/angularjs/hot.json', 'test/routes/fixtures/angularjs_hot.json');
      mock.withFile('/r/vim/hot.json', 'test/routes/fixtures/vim_hot.json');
      createUserAndCluster({
        user: { redditName: 'jack' },
        cluster: { name: 'foo', subreddits: ['vim', 'angularjs'] }
      }, function(user, cluster) {
        callRoute('/listing', {
          query: { userId: user.id, token: user.token, clusterId: cluster.id }
        }, {
          json: function(d) {
            expect(d.sorted.length).to.be(10);
            done();
          }
        });
      });
    });

    it('says no cluster found if user does not have permissions', function(done) {
      User.createWithToken({ redditName: 'jack' }, function(e, jack) {
        new User({ redditName: 'ollie' }).save(function(e, ollie) {
          new Cluster({ name: 'foo', owner: ollie, public: false }).save(function(e, cluster) {
            callRoute('/listing', {
              query: { userId: jack.id, token: jack.token, clusterId: cluster.id }
            }, {
              json: function(d) {
                expect(d).to.eql({ errors: [ 'no cluster found' ] });
                done();
              }
            });
          });
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
