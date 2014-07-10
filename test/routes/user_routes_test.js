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
          session: { state: 123 }
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

  describe('findOrCreate', function() {
    it('errors if no redditName given', function() {
      callRoute('/findOrCreate', {}, {
        json: function(d) {
          expect(d).to.eql({ error: 'missing redditName param' });
        }
      });
    });
    it('returns a user object from the DB', function(done) {
      var user = new User({ redditName: 'foo' });
      user.save(function(e, user) {
        var id = user.id;
        callRoute('/findOrCreate', {
          query: { redditName: 'foo', token: 123 },
          session: { state: 123 }
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
      callRoute('/findOrCreate', {
        query: { token: 123, redditName: 'foo'},
        session: { state: 456 }
      }, {
        json: function(d) {
          expect(d).to.eql({ error: 'invalid or missing token' });
        }
      });
    });

  });

  it('creates a user if they do not exist', function(done) {
    callRoute('/findOrCreate', {
      query: { redditName: 'foo', token: 123 },
      session: { state: 123 }
    }, {
      json: function(d) {
        expect(d.id).to.be.ok();
        expect(d.redditName).to.eql('foo');

        User.count(function(e, count) {
          expect(count).to.be(1);
          done();
        });
      }
    });
  });
});

