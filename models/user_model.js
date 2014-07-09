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

var User = mongoose.model('User', userSchema)

module.exports = User;

