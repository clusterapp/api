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

userSchema.methods.serialize = function() {
  return {
    id: this.id,
    lastActive: this.lastActive,
    redditName: this.redditName
  }
};

var User = mongoose.model('User', userSchema)

module.exports = User;

