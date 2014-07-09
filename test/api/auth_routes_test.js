var expect = require('expect.js');

var authRoutes = require('../../routes/auth').endpoints;

var expectRouteResponse = require('../test_routes_response')(authRoutes);

describe('auth routes', function() {
  describe('/reddit', function() {
    it('errors if not given a query parameter', function() {
      authRoutes['/reddit'].fn({}, {
        json: function(data) {
          expect(data).to.eql({ error: 'No redirect param given' });
        }
      });
    });
  });
});

