var ERRORS = require('../lib/error_messages');
var async = require('async');
var User = require('../models/user_model');

var matchTokenToUser = function(token, userId, errors, done) {
  User.findById(userId, function(e, user) {
    if(e || !user || user.token != token) errors.push('parameter: token is not valid');
    done();
  });
}

var ensureTokenExists = function(token, errors, done) {
  User.findOne({ token: token }, function(e, user) {
    if(e || !user) errors.push('parameter: token is not valid');
    done();
  });
};

var noParamsPassed = function(req, res) {
  if(req.query) {
    return false;
  } else {
    res.json({ errors: ['no parameters supplied'] });
    return true;
  }
};

var checkTokenAndIds = function(req, errors, cb) {
  var token = req.query.token;
  var userId = req.query.userId;
  if(token) {
    if(userId) {
      matchTokenToUser(token, userId, errors, cb);
    } else {
      ensureTokenExists(token, errors, cb);
    }
  } else {
    cb();
  }
};

var validateParamsExist = function(params, req, res, cb) {
  if(noParamsPassed(req, res)) return cb(false);

  var errors = [];
  params.forEach(function(p) {
    if(!req.query[p]) errors.push('parameter ' + p + ' is required');
  });

  checkTokenAndIds(req, errors, function() {
    if(errors.length > 0) {
      res.json({ errors: errors });
      return cb(false);
    } else {
      return cb(true);
    }
  });
}

module.exports = validateParamsExist;
