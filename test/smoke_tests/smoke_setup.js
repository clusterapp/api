require('../test_db_config');

var app = require('../../app');

before(function(done) {
  app.set('port', 9765);
  var server = app.listen(app.get('port'), function() {
    done();
  });
});
