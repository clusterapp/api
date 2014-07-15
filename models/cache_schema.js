var mongoose = require('mongoose');
var moment = require('moment');

var db = require('../database');

var urlIsUnique = function(value, done) {
  var Model = this.model(this.constructor.modelName);

  Model.find({ url: value }, function(e, result) {
    return done(result.length == 0);
  });
};

var cacheSchema = mongoose.Schema({
  url: { type: String, validate: [urlIsUnique, 'url is not unique'] },
  date: { type: Date, default: Date.now },
  data: Object
});

cacheSchema.methods.hasExpired = function() {
  var createdAt = moment(this.date);
  var now = moment();
  return now.diff(createdAt, 'hours') > 1;
};

cacheSchema.methods.notExpired = function() {
  return !this.hasExpired();
};

module.exports = cacheSchema;

