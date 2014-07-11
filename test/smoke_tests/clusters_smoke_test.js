require('./smoke_setup');
var request = require('request');
var expect = require('expect.js');

var User = require('../../models/user_model');
var Cluster = require('../../models/cluster_model');

var URL_BASE = 'http://127.0.0.1:9765/clusters';

var $ = require('./helpers');

describe('/', function() {
  it('returns the cluster', function(done) {
    User.createWithToken({ redditName: 'jack' }, function(e, user) {
      new Cluster({ name: 'foo', owner: user }).save(function(e, cluster) {
        $.get(URL_BASE, { id: cluster.id, token: user.token }, function(e, json) {
          expect(json).to.eql({
            id: cluster.id,
            name: cluster.name,
            createdAt: cluster.createdAt.toString(),
            owner: user.id,
            public: true,
            subreddits: [],
            admins: [],
            subscribers: []
          });
          done();
        });
      });
    });
  });
});

describe('/create', function() {
  it('creates a new cluster', function(done) {
    User.createWithToken({ redditName: 'jack' }, function(e, user) {
      $.post(URL_BASE + '/create', { userId: user.id, token: user.token }, JSON.stringify({
        owner: user.id,
        name: 'foo'
      }), function(e, json) {
        expect(json.name).to.eql('foo');
        expect(json.owner).to.eql(user.id);
        done();
      });
    });
  });
});

