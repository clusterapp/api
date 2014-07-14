require('./smoke_setup');
var request = require('request');
var expect = require('expect.js');

var User = require('../../models/user_model');
var Cluster = require('../../models/cluster_model');
var ListingCache = require('../../models/listing_cache_model');
var nock = require('nock');

var URL_BASE = 'http://127.0.0.1:9765/clusters';

var $ = require('./helpers');
var mock = require('../routes/mock_reddit_api');

describe('/listing', function() {
  it('gets a cluster listing', function(done) {
    // smoke tests don't usually have mocks, but this avoids making
    // a real request to the reddit api
    var vimMock = mock.withFile('/r/vim/hot.json', 'test/routes/fixtures/vim_hot.json');
    var angMock = mock.withFile('/r/angularjs/hot.json', 'test/routes/fixtures/angularjs_hot.json');
    User.createWithToken({ redditName: 'jack' }, function(e, user) {
      new Cluster({
        name: 'foo',
        owner: user,
        subreddits: ['vim', 'angularjs' ]
      }).save(function(e, cluster) {
        $.get(URL_BASE + '/listing', {
          clusterId: cluster.id,
          token: user.token,
          userId: user.id
        }, function(e, json) {
          expect(json.sorted.length).to.eql(10);
          expect(json.sorted[0].title)
            .to.eql("Angular\u2019s dependency injection annotation process");
          expect(vimMock.isDone()).to.eql(true);
          expect(angMock.isDone()).to.eql(true);
          done();
        });
      });
    });
  });

  it('uses the cache if one exists', function(done) {
    // smoke tests don't usually have mocks, but this avoids making
    // a real request to the reddit api
    var vimMock = mock.withFile('/r/vim/hot.json', 'test/routes/fixtures/vim_hot.json');
    User.createWithToken({ redditName: 'jack' }, function(e, user) {
      new Cluster({
        name: 'foo',
        owner: user,
        subreddits: ['vim']
      }).save(function(e, cluster) {
        var fullUrl = 'http://127.0.0.1:9765/clusters/listing?clusterId=' + cluster.id + '&token=' + user.token + '&userId=' + user.id;
        new ListingCache({ url: fullUrl, data: { foo: 2 } }).save(function(e, cache) {
          $.get(URL_BASE + '/listing', {
            clusterId: cluster.id,
            token: user.token,
            userId: user.id
          }, function(e, json) {
            expect(json.fromCache).to.eql(true);
            expect(vimMock.isDone()).to.be(false);
            nock.cleanAll();
            done();
          });
        });

      });
    });
  });
});

describe('/', function() {
  it('returns the cluster', function(done) {
    User.createWithToken({ redditName: 'jack' }, function(e, user) {
      new Cluster({ name: 'foo', owner: user }).save(function(e, cluster) {
        $.get(URL_BASE, { clusterId: cluster.id, token: user.token }, function(e, json) {
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

describe('/update', function() {
  it('updates the cluster', function(done) {
    User.createWithToken({ redditName: 'jack' }, function(e, user) {
      new Cluster({ owner: user, name: 'foo' }).save(function(e, cluster) {
        $.post(URL_BASE + '/update', { 
          userId: user.id, token: user.token, clusterId: cluster.id
        }, JSON.stringify({
          subreddits: ['vim']
        }), function(e, json) {
          expect(json.subreddits).to.eql(['vim']);
          done();
        });
      });
    });
  });
});

