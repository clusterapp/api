var expect = require('expect.js');

var authRoutes = require('../../routes/auth').endpoints;
var proxyquire = require('proxyquire');
var User = require('../../models/user_model');


var auth = proxyquire('../../routes/auth', {
  passport: {
    authenticate: function() {
      return function() {};
    }
  }
});

var authRoutes = auth.endpoints;

var expectRouteResponse = require('../test_routes_response')(authRoutes);

var callRoute = function(route, req, res) {
  authRoutes[route].fn(req, res);
};

describe('auth routes', function() {
  describe('/test_stub_oauth', function() {
    it('errors if the env variable is not set', function() {
      var oldToken =  '' + process.env.TEST_TOKEN;
      process.env.TEST_TOKEN = undefined;
      callRoute('/test_stub_oauth', {}, {
        json: function(d) {
          expect(d).to.eql({ error: 'forbidden' });
          process.env.TEST_TOKEN = oldToken;
        }
      });
    });

    it('redirects with the user details if the env var is set', function(done) {
      callRoute('/test_stub_oauth', {
        query: { redirect: 'foo', name: 'jack' }
      }, {
        redirect: function(loc) {
          expect(loc).to.match(/foo\?user_id=.+&user_name=jack&token=.+&last_active=.+/);
          done();
        }
      });
    });
  });


  describe('/reddit', function() {
    it('errors if not given a query parameter', function() {
      callRoute('/reddit', {}, {
        json: function(data) {
          expect(data).to.eql({ error: 'missing parameter: redirect' });
        }
      });
    });

    it('sets a session state hex', function() {
      var req = { session: {}, query: { redirect: 'f' } };
      callRoute('/reddit', req, {});
      expect(req.session.state).to.be.ok();
    });

    it('stores the redirect in the session', function() {
      var req = { session: {}, query: { redirect: 'f' } };
      callRoute('/reddit', req, {});
      expect(req.session.redirect).to.eql('f');
    });
  });

  describe('/reddit/success', function() {
    it('redirects to the redirect property on the session with the user data and the token', function(done) {
      var req = { session: { redirect: 'f', state: 'b' }, user: { name: 'jack' } };
      callRoute('/reddit/success', req, {
        redirect: function(loc) {
          expect(loc).to.match(/f\?user_id=.+&user_name=jack&token=.+&last_active=.+/);
          done();
        }
      });
    });

    it('creates a token on the user', function(done) {
      var req = { session: { redirect: 'f', state: 'b' }, user: { name: 'jack' } };
      callRoute('/reddit/success', req, {
        redirect: function(loc) {
          User.findOne({ redditName: 'jack' }, function(e, user) {
            expect(user.token).to.be.ok();
            done();
          });
        }
      });
    });

    it('creates a new token every single time the user logs in', function(done) {
      User.createWithToken({ redditName: 'jack' }, function(e, user) {
        var oldToken = user.token;

        callRoute('/reddit/success', {
          user: { name: 'jack' },
          session: { redirect: 'f' }
        }, {
          redirect: function(loc) {
            User.findOne({ redditName: 'jack' }, function(e, user) {
              expect(user.token).to.be.ok();
              expect(user.token).to.not.be(oldToken);
              done();
            });
          }
        });

      });
    });
  });

  describe('/reddit/failure', function() {
    it('returns authenticated: false', function() {
      callRoute('/reddit/failure', {}, {
        json: function(d) {
          expect(d).to.eql({ authenticated: false });
        }
      });
    });
  });
});

