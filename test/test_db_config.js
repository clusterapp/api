var db = require('../database');
var User = require('../models/user_model');

before(function(done) {
  db.on('open', function() {
    User.remove({}, done);
  })
});

after(function(done) {
  db.close(done);
});

// for some reason, the cleanup doesn't work unless we clean before and after
afterEach(function(done) {
  User.remove({}, done);
});

beforeEach(function(done) {
  User.remove({}, done);
});
