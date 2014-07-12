var expect = require('expect.js');
var mock = require('./mock_reddit_api.js');
var Listing = require('../../routes/listing');

describe('listings', function() {
  it('uses the after parameters if passed', function(done) {
    var vimMock = mock('/r/vim/hot.json?after=foo');
    var angularjsMock = mock('/r/angularjs/hot.json?after=bar');
    var listing = new Listing({ subreddits: ['vim', 'angularjs'] });

    listing.get({ after: { vim: 'foo', angularjs: 'bar' } }, function() {
      expectMocksToBeCalled(vimMock, angularjsMock);
      done();
    });
  });

  it('only uses after params if they are there', function(done) {
    var vimMock = mock('/r/vim/hot.json?after=foo');
    var angularjsMock = mock('/r/angularjs/hot.json');
    var listing = new Listing({ subreddits: ['vim', 'angularjs'] });

    listing.get({ after: { vim: 'foo' } }, function() {
      expectMocksToBeCalled(vimMock, angularjsMock);
      done();
    });
  });


  it('hits the end points for each subreddit', function(done) {
    var vimMock = mock('/r/vim/hot.json');
    var angularjsMock = mock('/r/angularjs/hot.json');
    var wtfMock = mock('/r/wtf/hot.json');
    var listing = new Listing({ subreddits: ['vim', 'angularjs', 'wtf'] });
    listing.get({}, function() {
      expectMocksToBeCalled(vimMock, angularjsMock, wtfMock)
      done();
    });
  });
});

var expectMocksToBeCalled = function() {
  var args = Array.prototype.slice.call(arguments);
  args.forEach(function(m) {
    expect(m.isDone()).to.be(true);
  });
}

var createUserAndCluster = function(opts, cb) {
  User.createWithToken(opts.user, function(e, user) {
    opts.cluster.owner = user;
    new Cluster(opts.cluster).save(function(e, cluster) {
      cb(user, cluster);
    });
  });
};

