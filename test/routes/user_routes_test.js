var expect = require('expect.js');

var userRoutes = require('../../routes/users').endpoints;

var expectRouteResponse = require('../test_routes_response')(userRoutes);

var User = require('../../models/user_model');

require('../test_db_config');

var timekeeper = require('timekeeper');

var callRoute = function(route, req, res) {
  userRoutes[route].fn(req, res);
};

describe('user routes', function() {
  describe('updateLastActive', function() {
    it('updates the last active date', function(done) {

      User.createWithToken({ redditName: 'jack' }, function(e, user) {
        var time = new Date(1893448800000); // January 1, 2030 00:00:00
        timekeeper.freeze(time); // Travel to that date.

        callRoute('/updateLastActive', {
          query: { token: user.token, id: user.id }
        }, {
          json: function(serialized) {
            expect(serialized.lastActive).to.eql(new Date(time).toString());
            timekeeper.reset();
            done();
          }
        });
      });
    });

    it('errors if no id given', function(done) {
      callRoute('/updateLastActive', {
        query: { token: 123 }
      }, {
        json: function(d) {
          expect(d).to.eql({ error: 'missing parameter: id' });
          done();
        }
      });
    });

    it('errors if the user does not match the token', function(done) {
      var user = new User({ redditName: 'jack' });
      user.save(function(e, user) {
        callRoute('/updateLastActive', {
          query: { token: 123, id: user.id },
        }, {
          json: function(d) {
            expect(d).to.eql({ error: 'parameter: id is not valid or does not match' });
            done();
          }
        });
      });
    });

    it('errors if no user found', function(done) {
      callRoute('/updateLastActive', {
        query: { token: 123, id: '123' },
      }, {
        json: function(d) {
          expect(d).to.eql({ error: 'parameter: id is not valid or does not match' });
          done();
        }
      });
    });
  });

  describe('/', function() {
    it('errors if no id given', function(done) {
      callRoute('/', {}, {
        json: function(d) {
          expect(d).to.eql({ error: 'missing parameter: id' });
          done();
        }
      });
    });

    it('returns the user if they exist', function(done) {
      User.createWithToken({ redditName: 'foo' }, function(e, user) {
        var id = user.id;
        callRoute('/', {
          query: { id: id, token: user.token }
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
          expect(d).to.eql({ error: 'parameter: id is not valid or does not match' });
          done();
        }
      });
    });

    it('does not allow the req if the user id given doesnt match the user id session', function(done) {
      callRoute('/', {
        query: { id: 456, token: 123 },
        session: { state: 123, userId: 789 }
      }, {
        json: function(d) {
          expect(d).to.eql({ error: 'parameter: id is not valid or does not match' });
          done();
        }
      });
    });
  });

});

