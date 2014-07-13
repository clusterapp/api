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

beforeEach(function(done) {
  User.remove({}, done);
});
