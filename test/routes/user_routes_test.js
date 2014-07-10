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
      var user = new User({ redditName: 'jack' });

      user.save(function(e, user) {
        var time = new Date(1893448800000); // January 1, 2030 00:00:00
        timekeeper.freeze(time); // Travel to that date.

        callRoute('/updateLastActive', {
          query: { token: 123, id: user.id } ,
          session: { state: 123, userName: 'jack' }
        }, {
          json: function(serialized) {
            expect(serialized.lastActive).to.eql(new Date(time).toString());
            timekeeper.reset();
            done();
          }
        });
      });
    });

    it('errors if no id given', function() {
      callRoute('/updateLastActive', {
        query: { token: 123 },
        session: { state: 123 }
      }, {
        json: function(d) {
          expect(d).to.eql({ error: 'missing id param' });
        }
      });
    });

    it('errors if the user is not the one in session', function(done) {
      var user = new User({ redditName: 'jack' });
      user.save(function(e, user) {
        callRoute('/updateLastActive', {
          query: { token: 123, id: user.id },
          session: { state: 123, userName: 'foo' }
        }, {
          json: function(d) {
            expect(d).to.eql({ error: 'user and token do not match' });
            done();
          }
        });
      });

    });

    it('errors if no user found', function() {
      callRoute('/updateLastActive', {
        query: { token: 123, id: '123' },
        session: { state: 123 }
      }, {
        json: function(d) {
          expect(d).to.eql({ error: 'no user found' });
        }
      });
    });
  });

  describe('/', function() {
    it('errors if no id given', function() {
      callRoute('/', {}, {
        json: function(d) {
          expect(d).to.eql({ error: 'missing id param' });
        }
      });
    });

    it('returns the user if they exist', function(done) {
      var user = new User({ redditName: 'foo' });
      user.save(function(e, user) {
        var id = user.id;
        callRoute('/', {
          query: { id: id, token: 123 },
          session: { state: 123, userId: id }
        }, {
          json: function(d) {
            expect(d.id).to.eql(id);
            expect(d.redditName).to.eql('foo');
            done();
          }
        });
      });
    });

    it('errors with invalid or missing hex', function() {
      callRoute('/', {
        query: { token: 123, id: 'ABC'},
        session: { state: 456 }
      }, {
        json: function(d) {
          expect(d).to.eql({ error: 'invalid or missing token' });
        }
      });
    });

    it('does not allow the req if the user id given doesnt match the user id session', function() {
      callRoute('/', {
        query: { id: 456, token: 123 },
        session: { state: 123, userId: 789 }
      }, {
        json: function(d) {
          expect(d).to.eql({ error: 'user and token do not match' });
        }
      });
    });
  });

});

