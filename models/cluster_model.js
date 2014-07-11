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

var Cluster = mongoose.model('Cluster', clusterSchema);

module.exports = Cluster;
