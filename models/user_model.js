var mongoose = require('mongoose');
var db = require('../database');
var crypto = require('crypto');

var Cluster = require('./cluster_model');

var userSchema = mongoose.Schema({
  redditName: String,
  lastActive: { type: Date, default: Date.now },
  token: String
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

userSchema.statics.createWithToken = function(opts, cb) {
  var user = new User(opts);
  user.save(function(e, user) {
    if(e) return cb(e);
    user.saveNewToken(function(e, user) {
      return cb(e, user);
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

userSchema.methods.saveNewToken = function(cb) {
  this.token = crypto.randomBytes(32).toString('hex');
  this.save(cb);
};

userSchema.statics.tokenIsValid = function(id, token, cb) {
  User.findOne({ _id: id }, function(e, user) {
    if(e) return cb(e);
    if(!user) return cb(null, false);
    return cb(null, token == user.token);
  });
};

var User = mongoose.model('User', userSchema)

module.exports = User;

