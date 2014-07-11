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

    it('persists it to the database', function(done) {
      var user = new User({ redditName: 'jack' });
      var id = user.id;
      var time = Date.now();
      timekeeper.freeze(time);

      user.updateLastActive(function(e, u) {
        expect(u.lastActive.toString()).to.eql(new Date(time).toString());
        timekeeper.reset();
        done();
      });
    });
  });

  describe('.findOrCreate', function() {
    it('creates a user if they do not exist', function(done) {
      User.findOrCreate('jack', function(e, user) {
        User.count(function(e, c) {
          expect(c).to.eql(1);
          done();
        });
      });
    });

    it('finds a user if they exist', function(done) {
      var jack = new User({ redditName: 'jack' });
      jack.save(function(e, user) {
        User.findOrCreate('jack', function(e, user) {
          expect(jack.id).to.eql(user.id);
          User.count(function(e, c) {
            expect(c).to.eql(1);
            done();
          });
        });
      });;
    });
  });
  describe('#serialize', function() {
    it('only contains fields we want exposed', function() {
      var user = new User({ redditName: 'jack' }).serialize();
      expect(Object.keys(user)).to.eql(['id', 'lastActive', 'redditName']);
    });
  });

});
