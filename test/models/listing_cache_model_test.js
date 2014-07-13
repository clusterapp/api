var ListingCache = require('../../models/listing_cache_model');

var timekeeper = require('timekeeper');
var expect = require('expect.js');

require('../test_db_config');

describe.only('Listing Cache model', function() {
  describe('#hasExpired', function() {
    it('returns true if the date is more than an hour in the past', function(done) {
      new ListingCache({ url: 'foo' }).save(function(e, cache) {
        var now = new Date(Date.now());
        var twoHoursLater = now.setHours(now.getHours() + 2);
        timekeeper.freeze(twoHoursLater); // Travel to that date.
        expect(cache.hasExpired()).to.eql(true);
        timekeeper.reset();
        done();
      });
    });

    it('returns false if the date is less than one hour in the past', function(done) {
      new ListingCache({ url: 'foo' }).save(function(e, cache) {
        var now = new Date(Date.now());
        var halfHourLater = now.setHours(now.getHours() + 0.5);
        timekeeper.freeze(halfHourLater); // Travel to that date.
        expect(cache.hasExpired()).to.eql(false);
        timekeeper.reset();
        done();
      });
    });
  });
});
