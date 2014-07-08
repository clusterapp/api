var request = require('supertest')
var app = require('../../app');

var endpoints = require('../../routes/users').endpoints;

describe('/users', function() {
  it('GET /', function(done) {
    request(app).get('/users').expect(200, done);
  });
});
