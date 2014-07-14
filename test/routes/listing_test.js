var expect = require('expect.js');
var mock = require('./mock_reddit_api.js');
var Listing = require('../../routes/listing');
var ApiCache = require('../../models/api_cache_model.js');
var nock = require('nock');

require('../shorter_stack_traces');
require('../test_db_config');

describe('listings', function() {
  //TODO: write more caching tests about expiry, etc
  describe('api endpoints', function() {
    it('has the endpoints cached', function(done) {
      var vimMock = mock('/r/vim/hot.json');
      var angularjsMock = mock('/r/angularjs/hot.json');
      var listing = new Listing({ subreddits: ['vim', 'angularjs'] });

      new ApiCache({ url: 'http://www.reddit.com/r/vim/hot.json', data: {
        data: {
          children: []
        }
      } }).save(function(e, cache) {
        listing.get({}, function() {
          expect(vimMock.isDone()).to.eql(false);
          expect(angularjsMock.isDone()).to.eql(true);
          nock.cleanAll();
          done();
        });
      });

    });

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
        expectMocksToBeCalled(vimMock, angularjsMock, wtfMock);
        done();
      });
    });
  });

  describe('processing the subreddit data', function() {
    var listing;
    beforeEach(function() {
      mock.withFile('/r/vim/hot.json', 'test/routes/fixtures/vim_hot.json');
      mock.withFile('/r/angularjs/hot.json', 'test/routes/fixtures/angularjs_hot.json');
      listing = new Listing({ subreddits: ['vim', 'angularjs'] });
    });

    it('returns all the after parameters', function(done) {
      listing.get({}, function(e, data) {
        expect(data.after.vim).to.eql("t3_2a7cvd");
        expect(data.after.angularjs).to.eql("t3_2a4n4l");
        done();
      });
    });

    it('returns the raw json for each subreddit', function(done) {
      listing.get({}, function(e, data) {
        expect(data.vim.data.children[0].data.title)
        .to.eql("How can I remap ESC to Ctrl-C and navigation keys to JKL; ?");
        expect(data.angularjs.data.children[0].data.title)
        .to.eql("Angular\u2019s dependency injection annotation process");
        done();
      });
    });

    it('merges them together based on the scores of each', function(done) {
      listing.get({}, function(e, data) {
        var result = data.sorted;
        expect(result[0].title).to.eql("Angular\u2019s dependency injection annotation process");
        expect(result[1].title)
        .to.eql("How can I remap ESC to Ctrl-C and navigation keys to JKL; ?");
        expect(result[2].title).to.eql("12 Vim Tips");
        expect(result[3].title)
        .to.eql("Using Scope.$watch() To Watch Functions In AngularJS");
        done();
      });
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

