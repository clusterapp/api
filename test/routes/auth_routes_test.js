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
          expect(loc).to.match(/f\?user_id=.+&user_name=jack&token=.+/);
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

