var expect = require('expect.js');

var testingRoutes = require('../../routes/testing').endpoints;

var callRoute = function(route, req, res) {
  testingRoutes[route].fn(req, res);
};

describe('testing routes', function() {
  describe('/delete_clusters', function() {
    it('errors if the env variable is not set', function() {
      var oldToken =  '' + process.env.TEST_TOKEN;
      process.env.TEST_TOKEN = undefined;
      callRoute('/delete_clusters', {}, {
        json: function(d) {
          expect(d).to.eql({ error: 'forbidden' });
          process.env.TEST_TOKEN = oldToken;
        }
      });
    });

    it('redirects with the user details if the env var is set', function(done) {
      callRoute('/delete_clusters', {}, {
        json: function(d) {
          expect(d).to.eql({ result: 'removed clusters'});
          done();
        }
      });
    });
  });
});
