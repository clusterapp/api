var expect = require('expect.js');

var authRoutes = require('../../routes/auth').endpoints;
var proxyquire = require('proxyquire');


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
          expect(data).to.eql({ error: 'No redirect param given' });
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
    it('redirects to the redirect property on the session with the user data and the token', function() {
      var req = { session: { redirect: 'f', state: 'b' }, user: { _raw: 'foo' } };
      callRoute('/reddit/success', req, {
        redirect: function(loc) {
          expect(loc).to.eql('f?data=foo&token=b');
        }
      });
    });

    it('stores the user name in session', function() {
      var req = { session: { redirect: 'f', state: 'b' }, user: { _raw: 'foo', name: 'foo' } };
      callRoute('/reddit/success', req, {
        redirect: function(loc) {
          expect(req.session.userName).to.eql('foo');
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

