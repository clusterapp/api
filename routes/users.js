// all these routes are nested under /users

var express = require('express');
var User = require('../models/user_model');
var Cluster = require('../models/cluster_model');
var async = require('async');


var ERRORS = require('../lib/error_messages');

var validateParamsExist = require('../lib/param_validator');

var validateParams = function(req, res, cb) {
  if(!req.query || !req.query.id) {
    res.json(ERRORS.MISSING_PARAM('id'));
    return cb(false);
  } else if(!req.query || !req.query.token) {
    res.json(ERRORS.MISSING_PARAM('token'));
    return cb(false);
  } else {
    User.tokenIsValid(req.query.id, req.query.token, function(e, valid) {
      if(!valid) {
        res.json(ERRORS.INVALID_PARAM('id'));
        return cb(false);
      } else {
        return cb(true);
      }
    });
  };

};

var userRoutes = {
  '/': {
    method: 'get',
    fn: function(req, res) {
      validateParamsExist(['userId', 'token'], req, res, function(valid) {
        if(!valid) return;
        User.findOne({ _id: req.query.userId }, function(e, user) {
          if(user) {
            res.json(user.serialize());
          } else {
            res.json(ERRORS.NO_USER_FOUND());
          }
        });
      });
    }
  },
  '/id': {
    method: 'get',
    fn: function(req, res) {
      validateParamsExist(['userId', 'token', 'queryUserId'], req, res, function(valid) {
        if(!valid) return;

        User.findOne({ _id: req.query.queryUserId }, function(e, user) {
          if(e) return res.json({ errors: [ e.message ] });
          if(!user) return res.json({ errors: ['no user found'] });
          return res.json(user.serialize());
        });
      });
    }
  },
  '/name': {
    method: 'get',
    fn: function(req, res) {
      validateParamsExist(['name'], req, res, function(valid) {
        if(!valid) return;

        User.findOne({ redditName: req.query.name }, function(e, user) {
          if(e) return res.json({ errors: [ e.message ] });
          if(!user) return res.json({ errors: ['no user found'] });
          return res.json(user.serialize());
        });
      });
    }
  },
  '/updateLastActive': {
    method: 'post',
    fn: function(req, res) {
      validateParamsExist(['userId', 'token'], req, res, function(valid) {
        if(!valid) return;
        User.findById(req.query.userId, function(e, user) {
          if(user) {
            user.updateLastActive(function(e, u) {
              res.json(u.serialize());
            });
          } else {
            res.json(ERRORS.NO_USER_FOUND());
          }
        });
      });
    }
  },
  '/all_names': {
    method: 'get',
    fn: function(req, res) {
      validateParamsExist(['userId', 'token'], req, res, function(valid) {
        if(!valid) return;
        User.find({}, function(e, users) {
          if(e || !users) return res.json({ errors: ['no users found'] });
          res.json(users.map(function(u) { return u.redditName; }));
        });
      });
    }
  },
  '/destroyToken': {
    method: 'post',
    fn: function(req, res) {
      validateParamsExist(['userId', 'token'], req, res, function(valid) {
        if(!valid) return;
        User.findById(req.query.userId, function(e, user) {
          user.token = undefined;
          user.save(function(e, user) {
            res.json({ success: 'token destroyed' });
          });
        });
      });
    }
  },
  '/clusters/own': {
    method: 'get',
    fn: function(req, res) {
      validateParamsExist(['userId', 'token'], req, res, function(valid) {
        if(!valid) return;
        Cluster.find({ owner: req.query.userId }, function(e, clusters) {
          Cluster.serializeList(clusters, res.json.bind(res));
        });
      });
    }
  },
  '/clusters/admin': {
    method: 'get',
    fn: function(req, res) {
      validateParamsExist(['userId', 'token'], req, res, function(valid) {
        if(!valid) return;
        Cluster.find({
          admins: { $in: [req.query.userId] }
        }, function(e, clusters) {
          Cluster.serializeList(clusters, res.json.bind(res));
        })
      });
    }
  },
  '/clusters/subscribed': {
    method: 'get',
    fn: function(req, res) {
      validateParamsExist(['userId', 'token'], req, res, function(valid) {
        if(!valid) return;
        Cluster.find({
          subscribers: { $in: [req.query.userId] }
        }, function(e, clusters) {
          Cluster.serializeList(clusters, res.json.bind(res));
        })
      });
    }
  }
};

var router = express.Router();

Object.keys(userRoutes).forEach(function(route) {
  router[userRoutes[route].method](route, userRoutes[route].fn);
});


module.exports = {
  router: router,
  endpoints: userRoutes
}
