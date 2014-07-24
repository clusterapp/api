var expect = require('expect.js');

var userRoutes = require('../../routes/users').endpoints;

var expectRouteResponse = require('../test_routes_response')(userRoutes);

var User = require('../../models/user_model');
var Cluster = require('../../models/cluster_model');

require('../test_db_config');

var timekeeper = require('timekeeper');

var callRoute = function(route, req, res) {
  userRoutes[route].fn(req, res);
};

var async = require('async');

var createUserAndCluster = function(opts, cb) {
  User.createWithToken(opts.user, function(e, user) {
    opts.cluster.owner = user;
    new Cluster(opts.cluster).save(function(e, cluster) {
      cb(user, cluster);
    });
  });
};

describe('user routes', function() {
  describe('/clusters', function() {
    describe('/own', function() {
      it('lists the clusters the user owns', function(done) {
        createUserAndCluster({
          user: { redditName: 'jack' },
          cluster: { name: 'foo' }
        }, function(user, cluster) {
          callRoute('/clusters/own', {
            query: { userId: user.id, token: user.token }
          }, {
            json: function(d) {
              expect(d.length).to.eql(1);
              expect(d[0].name).to.eql('foo');
              expect(d[0].owner.redditName).to.eql('jack');
              done();
            }
          });
        });
      });
    });
    describe('/admin', function() {
      it('lists the clusters the user is an admin of', function(done) {
        createUserAndCluster({
          user: { redditName: 'jack' },
          cluster: { name: 'foo' }
        }, function(user, cluster) {
          User.createWithToken({ redditName: 'ollie' }, function(e, ollie) {
            cluster.saveAdmin(ollie, function(e, cluster) {
              callRoute('/clusters/admin', {
                query: { userId: ollie.id, token: ollie.token }
              }, {
                json: function(d) {
                  expect(d.length).to.eql(1);
                  expect(d[0].name).to.eql('foo');
                  expect(d[0].admins[0].redditName).to.eql('ollie');
                  done();
                }
              });
            });
          });
        });
      });
    });

    describe('/subscribed', function() {
      it('lists the clusters the user has subscribed to', function(done) {
        createUserAndCluster({
          user: { redditName: 'jack' },
          cluster: { name: 'foo' }
        }, function(user, cluster) {
          User.createWithToken({ redditName: 'ollie' }, function(e, ollie) {
            cluster.saveSubscriber(ollie, function(e, cluster) {
              callRoute('/clusters/subscribed', {
                query: { userId: ollie.id, token: ollie.token }
              }, {
                json: function(d) {
                  expect(d.length).to.eql(1);
                  expect(d[0].name).to.eql('foo');
                  expect(d[0].subscribers[0].redditName).to.eql('ollie');
                  done();
                }
              });
            });
          });
        });
      });
    });
  });


  describe('/destroyToken', function() {
    it('destroys the user token', function(done) {
      User.createWithToken({ redditName: 'foo' }, function(e, user) {
        callRoute('/destroyToken', {
          query: { userId: user.id, token: user.token }
        }, {
          json: function(d) {
            User.findById(user.id, function(e, user) {
              expect(user.token).to.eql(undefined);
              done();
            });
          }
        });
      });
    });
  });

  describe('updateLastActive', function() {
    it('updates the last active date', function(done) {
      User.createWithToken({ redditName: 'jack' }, function(e, user) {
        var time = new Date(1893448800000); // January 1, 2030 00:00:00
        timekeeper.freeze(time); // Travel to that date.

        callRoute('/updateLastActive', {
          query: { token: user.token, userId: user.id }
        }, {
          json: function(serialized) {
            expect(serialized.lastActive).to.eql(new Date(time).toString());
            timekeeper.reset();
            done();
          }
        });
      });
    });

    it('errors if the user does not match the token', function(done) {
      var user = new User({ redditName: 'jack' });
      user.save(function(e, user) {
        callRoute('/updateLastActive', {
          query: { token: 123, userId: user.id },
        }, {
          json: function(d) {
            expect(d).to.eql({ errors: [
              'parameter: token is not valid'
            ]});
            done();
          }
        });
      });
    });

    it('errors if no user found', function(done) {
      callRoute('/updateLastActive', {
        query: { token: 123, userId: '123' },
      }, {
        json: function(d) {
          expect(d).to.eql({ errors: ['parameter: token is not valid'] });
          done();
        }
      });
    });
  });

  describe('/', function() {
    it('errors if no id given', function(done) {
      callRoute('/', { query: {} }, {
        json: function(d) {
          expect(d).to.eql({ errors: ['parameter userId is required', 'parameter token is required'] });
          done();
        }
      });
    });

    it('returns the user if they exist', function(done) {
      User.createWithToken({ redditName: 'foo' }, function(e, user) {
        var id = user.id;
        callRoute('/', {
          query: { userId: id, token: user.token }
        }, {
          json: function(d) {
            expect(d.id).to.eql(id);
            expect(d.redditName).to.eql('foo');
            done();
          }
        });
      });
    });

    it('errors with invalid or missing hex', function(done) {
      callRoute('/', {
        query: { token: 123, id: 'ABC'}
      }, {
        json: function(d) {
          expect(d).to.eql({ errors: [
            'parameter userId is required',
            'parameter: token is not valid'
          ]});
          done();
        }
      });
    });

  });

  var twoUsers = function(done) {
    var users = [];
    async.each(['jack', 'ollie'], function(name, cb) {
      User.createWithToken({ redditName: name }, function(e, user) {
        users.push(user);
        cb();
      });
    }, function() {
      done(users[0], users[1]);
    });
  };

  describe('/all_names', function() {
    it('lists all the user names of every user in the system', function(done) {
      twoUsers(function(u1, u2) {
        callRoute('/all_names', {
          query: { userId: u1.id, token: u1.token }
        }, {
          json: function(d) {
            expect(d.length).to.eql(2);
            expect(d.indexOf(u2.redditName) > -1).to.eql(true);
            expect(d.indexOf(u1.redditName) > -1).to.eql(true);
            done();
          }
        });
      });
    });
  });

  describe('/id', function() {
    it('gets a user by their id', function(done) {
      twoUsers(function(u1, u2) {
        callRoute('/id', {
          query: { userId: u1.id, token: u1.token, queryUserId: u2.id }
        }, {
          json: function(d) {
            expect(d.id).to.eql(u2.id);
            done();
          }
        });
      });
    });
  });

  describe('/name', function() {
    it('returns the user if they exist', function(done) {
      User.createWithToken({ redditName: 'foo' }, function(e, user) {
        callRoute('/name', {
          query: { name: 'foo' }
        }, {
          json: function(d) {
            expect(d.id).to.eql(user.id);
            expect(d.redditName).to.eql('foo');
            done();
          }
        });
      });
    });
  });
});

