var mongoose = require('mongoose');
var db = require('../database');
var User = require('./user_model');
var async = require('async');


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
    Cluster.find({ owner: this.owner }, function(e, clusters) {
      var names = clusters.map(function(c) { return c.name; });
      return done(!(names.indexOf(value) > -1));
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

clusterSchema.statics.serializeList = function(clusters, done) {
  async.map(clusters, function(cluster, cb) {
    cluster.serialize(function(res) {
      cb(null, res);
    });
  }, function(e, serialized) {
    done(serialized);
  });
}

clusterSchema.methods.serialize = function(callback) {
  var resp = {
    public: this.public,
    subreddits: this.subreddits,
    admins: this.admins.map(function(admin) { return admin.toString(); }),
    subscribers: this.subscribers.map(function(admin) { return admin.toString(); })
  };

  ['id', 'name', 'createdAt'].forEach(function(item) {
    resp[item] = this[item].toString();
  }.bind(this));

  this.populate('owner admins subscribers', function(e, cluster) {
    resp.owner = cluster.owner.serialize();
    resp.admins = cluster.admins.map(function(a) { return a.serialize(); });
    resp.subscribers = cluster.subscribers.map(function(s) { return s.serialize(); });
    callback(resp);
  });
};

clusterSchema.methods.saveAdmin = function(user, cb) {
  if(user._id === this.owner) {
    return cb(null, this);
  }
  this.admins.push(user._id);
  this.save(cb);
};

clusterSchema.methods.saveSubscriber = function(user, cb) {
  if(user._id === this.owner || this.admins.indexOf(user._id) > -1) {
    return cb(null, this);
  }
  this.subscribers.push(user._id);
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

clusterSchema.statics.clustersForUserId = function(userId, cb) {
  Cluster.find({ owner: userId }, function(e, clusters) {
    if(e) return cb(e);
    cb(null, clusters);
  });
};

var Cluster = mongoose.model('Cluster', clusterSchema);

module.exports = Cluster;
