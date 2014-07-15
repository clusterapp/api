var mongoose = require('mongoose');
var db = require('../database');
var User = require('./user_model');

var Schema = mongoose.Schema;

var nameValidator = function(value, done) {
  Cluster.findOne({ name: value, owner: this.owner }, function(e, cluster) {
    // if a cluster exists with this name and the same owner
    // and the IDs match, that means it's this one
    // and the name is not being changed, so must be valid
    if(cluster && this._id) {
      if(cluster._id.toString() == this._id.toString()) {
        return done(true);
      }
    }

    // if we get here that means this user/name combo does
    // not exist, so we have to go and make sure the chosen name
    // is valid
    User.findById(this.owner, function(e, user) {
      Cluster.clusterNameIsUnique(user, value, function(res) {
        return done(res);
      });
    });
  }.bind(this));
};

var clusterSchema = Schema({
  name: { type: String, validate: [nameValidator, 'cluster name is not unique'] },
  createdAt: { type: Date, default: Date.now },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  public: { type: Boolean, default: true },
  subreddits: [String],
  admins: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  subscribers: [{ type: Schema.Types.ObjectId, ref: 'User' }]
});

clusterSchema.methods.serialize = function() {
  var resp = {
    public: this.public,
    subreddits: this.subreddits,
    admins: this.admins.map(function(admin) { return admin.toString(); }),
    subscribers: this.subscribers.map(function(admin) { return admin.toString(); })
  };

  ['id', 'name', 'createdAt', 'owner'].forEach(function(item) {
    resp[item] = this[item].toString();
  }.bind(this));

  return resp;
};

clusterSchema.methods.saveAdmin = function(user, cb) {
  if(user._id === this.owner) {
    return cb(null, this);
  }
  this.admins.push(user._id);
  this.save(cb);
};

clusterSchema.methods.userIdCanEdit = function(userId) {
  return (this.owner.toString() === userId ||
          this.admins.map(function(a) { return a.toString(); }).indexOf(userId) > -1);
};

clusterSchema.statics.userHasPermission = function(userId, clusterId, cb) {
  Cluster.findById(clusterId, function(e, cluster) {
    if(e) return cb(false);
    if(cluster.public) return cb(true, cluster);
    if(!userId) return cb(false);
    userId = userId.toString();
    if(cluster.owner && cluster.owner.toString() === userId) return cb(true, cluster);
    if(cluster.admins.map(function(a) { return a.toString(); }).indexOf(userId) > -1) return cb(true, cluster);
    return cb(false);
  });
};

clusterSchema.statics.clusterNameIsUnique = function(user, clusterName, cb) {
  Cluster.find({
    owner: user.id,
    name: new RegExp('^' + clusterName + '$', 'i')
  }, function(e, clusters) {
    cb(clusters.length === 0);
  });
};

clusterSchema.statics.clustersForUser = function(user, cb) {
  return Cluster.clustersForUserId(user._id, cb);
};

clusterSchema.statics.clustersForUserId = function(userId, cb) {
  Cluster.find({ owner: userId }, function(e, clusters) {
    if(e) return cb(e);
    cb(null, clusters.map(function(c) { return c.serialize() }));
  });
};

var Cluster = mongoose.model('Cluster', clusterSchema);

module.exports = Cluster;
