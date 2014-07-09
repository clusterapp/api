var User = require('../../models/user_model');
var timekeeper = require('timekeeper');
var expect = require('expect.js');

require('../test_db_config');

describe('User model', function() {
  describe('lastActive', function() {
    it('is set to Date.now by default', function() {
      var time = Date.now();
      timekeeper.freeze(time);

      var user = new User({ redditName: 'jack' });
      expect(user.lastActive.toString()).to.eql(new Date(time).toString());

      timekeeper.reset();
    });
  });

  describe('#updateLastActive', function() {
    it('updates the lastActive field to be current time', function() {
      var user = new User({ redditName: 'jack' });
      var time = Date.now();
      timekeeper.freeze(time);

      user.updateLastActive();

      expect(user.lastActive.toString()).to.eql(new Date(time).toString());

      timekeeper.reset();
    });

    it('persists it to the database', function() {
      var user = new User({ redditName: 'jack' });
      var id = user.id;
      var time = Date.now();
      timekeeper.freeze(time);

      user.updateLastActive(function(e, u) {
        expect(u.lastActive.toString()).to.eql(new Date(time).toString());
        timekeeper.reset();
      });
    });
  });

});
