var mongoose = require('mongoose');
var db = require('../database');
var User = require('./user_model');

var Schema = mongoose.Schema;

var nameValidator = function(value, done) {
  User.findById(this.owner, function(e, user) {
    Cluster.clusterNameIsUnique(user, value, function(res) {
      return done(res);
    });
  });
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
  Cluster.find({ owner: user._id }, function(e, clusters) {
    if(e) return cb(e);
    cb(null, clusters.map(function(c) { return c.serialize() }));
  });
};

var Cluster = mongoose.model('Cluster', clusterSchema);

module.exports = Cluster;
