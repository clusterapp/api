var mongoose = require('mongoose');
var db = require('../database');

var userSchema = mongoose.Schema({
  redditName: String,
  lastActive: { type: Date, default: Date.now },
});

userSchema.methods.updateLastActive = function(cb) {
  this.lastActive = Date.now();
  this.save(cb);
};

userSchema.statics.findOrCreate = function(name, cb) {
  User.findOne({ redditName: name }, function(e, user) {
    if(e) { return cb(e) };
    if(user) { return cb(null, user) };
    new User({ redditName: name }).save(function(e, user) {
      if(e) { return cb(e) };
      if(user) { return cb(null, user) };
    });
  });
};

userSchema.methods.serialize = function() {
  return {
    id: this.id.toString(),
    lastActive: this.lastActive.toString(),
    redditName: this.redditName
  }
};

var User = mongoose.model('User', userSchema)

module.exports = User;

