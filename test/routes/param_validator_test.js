var expect = require('expect.js');

var validateParamsExist = require('../../routes/param_validator');
var User = require('../../models/user_model');

describe.only('param validator', function() {
  it('errors if no params at all given', function(done) {
    validateParamsExist([], {}, {
      json: function(d) {
        expect(d).to.eql({ errors: ['no parameters supplied' ]});
      }
    }, function(res) {
      expect(res).to.eql(false);
      done();
    });
  });

  it('errors if params do not exist', function(done) {
    validateParamsExist(['foo', 'bar'], { query: {} }, {
      json: function(d) {
        expect(d).to.eql({ errors: ['parameter foo is required', 'parameter bar is required'] });
      }
    }, function(res) {
      expect(res).to.eql(false);
      done();
    });
  });

  it('fails if the token does not exists in the DB', function(done) {
    validateParamsExist(['token'], { query: { token: '1234' } }, {
      json: function(d) {
        expect(d).to.eql({ errors: ['parameter: token is not valid'] });
      }
    }, function(res) {
      expect(res).to.eql(false);
      done();
    });
  });

  it('succeeds if the token is in the db', function(done) {
    User.createWithToken({ redditName: 'jack'}, function(e, user) {
      validateParamsExist(['token'], { query: { token: user.token } }, {}, function(res) {
        expect(res).to.eql(true);
        done();
      });
    });
  });

  it('passes if token does match given user', function(done) {
    User.createWithToken({ redditName: 'jack'}, function(e, user) {
      validateParamsExist(['token', 'userId'], { query: { token: user.token, userId: user.id } }, {}, function(res) {
        expect(res).to.eql(true);
        done();
      });
    });
  });

  it('fails if token does not match given user', function(done) {
    User.createWithToken({ redditName: 'jack'}, function(e, user) {
      validateParamsExist(['token', 'userId'], { query: { token: '1234', userId: user.id } }, {
        json: function(d) {
          expect(d).to.eql({ errors: ['parameter: token is not valid'] });
        }
      }, function(res) {
        expect(res).to.eql(false);
        done();
      });
    });
  });
});
