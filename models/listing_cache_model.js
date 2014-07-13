var mongoose = require('mongoose');
var moment = require('moment');

var db = require('../database');

var cacheSchema = mongoose.Schema({
  url: String,
  date: { type: Date, default: Date.now },
});

cacheSchema.methods.hasExpired = function() {
  var createdAt = moment(this.date);
  var now = moment();
  return now.diff(createdAt, 'hours') > 1;
};

var ListingCache = mongoose.model('ListingCache', cacheSchema)

module.exports = ListingCache;

