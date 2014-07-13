var db = require('../database');
var User = require('../models/user_model');
var Cluster = require('../models/cluster_model');
var async = require('async');


var tidyUp = function(done) {
  async.each([User, Cluster], function(i, cb) {
    i.remove({}, cb);
  }, done);
};

before(function(done) {
  db.on('open', function() {
    tidyUp(done);
  })
});

after(function(done) {
  db.close(done);
});

beforeEach(function(done) {
  tidyUp(done);
});
