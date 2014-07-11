var mongoose = require('mongoose');
var db = require('../database');

var Schema = mongoose.Schema;
var clusterSchema = Schema({
  name: String,
  createdAt: { type: Date, default: Date.now },
  owner: { type: Schema.Types.ObjectId, ref: 'User' },
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
    userId = userId.toString();
    if(e) return cb(false);
    if(cluster.public) return cb(true);
    if(cluster.owner && cluster.owner.toString() === userId) return cb(true);
    if(cluster.admins.map(function(a) { return a.toString(); }).indexOf(userId) > -1) return cb(true);
    return cb(false);
  });
};

var Cluster = mongoose.model('Cluster', clusterSchema);

module.exports = Cluster;
