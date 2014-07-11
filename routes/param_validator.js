var ERRORS = require('./error_messages');
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

//TODO: this needs some love and attention
var validateParamsExist = function(params, req, res, cb) {
  if(!req.query) {
    res.json({ errors: ['no parameters supplied'] });
    return cb(false);
  } else {
    var errors = [];
    async.each(params, function(p, callback) {
      if(!req.query[p]) {
        errors.push('parameter ' + p + ' is required');
        callback();
      } else {
        if(p === 'token' && req.query.token) {
          if(params.indexOf('userId') > -1 && req.query.userId) {
            matchTokenToUser(req.query.token, req.query.userId, errors, callback);
          } else {
            ensureTokenExists(req.query.token, errors, callback);
          }
        } else {
          callback();
        }
      }
    }, function(err) {
      if(errors.length > 0) {
        res.json({ errors: errors });
        return cb(false);
      } else {
        return cb(true);
      }
    });
  };
}

module.exports = validateParamsExist;
