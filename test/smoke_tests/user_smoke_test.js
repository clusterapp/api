require('./smoke_setup');
var request = require('request');
var expect = require('expect.js');
var timekeeper = require('timekeeper');


var User = require('../../models/user_model');
var Cluster = require('../../models/cluster_model');

var URL_BASE = 'http://127.0.0.1:9765/users';

var $ = require('./helpers');

describe('/', function() {
  it('gets the current user and returns it', function(done) {
    User.createWithToken({ redditName: 'jack' }, function(e, user) {
      $.get(URL_BASE, { userId: user.id, token: user.token }, function(e, json) {
        expect(json).to.eql({
          id: user.id,
          lastActive: user.lastActive.toString(),
          redditName: 'jack'
        });
        done();
      });
    });
  });
});

describe('/clusters/own', function() {
  it('lists the clusters the user owns', function(done) {
    User.createWithToken({ redditName: 'jack' }, function(e, user) {
      new Cluster({ name: 'foo', owner: user }).save(function(e, cluster) {
        $.get(URL_BASE + '/clusters/own', {
          userId: user.id, token: user.token
        }, function(e, json) {
          expect(json.length).to.eql(1);
          expect(json[0].name).to.eql('foo');
          done();
        });
      });
    });
  });
});

describe('/updateLastActive', function() {
  it('updates the lastActive date', function(done) {
    User.createWithToken({ redditName: 'jack' }, function(e, user) {
      var time = new Date(1893448800000); // January 1, 2030 00:00:00
      timekeeper.freeze(time); // Travel to that date.
      $.post(URL_BASE + '/updateLastActive', { userId: user.id, token: user.token }, '', function(e, json) {
        expect(json).to.eql({
          id: user.id,
          lastActive: new Date(time).toString(),
          redditName: 'jack'
        });
        timekeeper.reset();
        done();
      });
    });
  });
});
