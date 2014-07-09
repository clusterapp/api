var expect = require('expect.js');

var userRoutes = require('../../routes/users').endpoints;

var expectRouteResponse = require('../test_routes_response')(userRoutes);

describe('user routes', function() {
  describe('index', function() {
    it('returns hello world', function() {
      expectRouteResponse('/', { foo: 'hello world' });
    });
  });
});

