// all these routes are nested under /users

var express = require('express');
var User = require('../models/user_model');

var userRoutes = {
  '/findOrCreate': {
    method: 'get',
    fn: function(req, res) {
      var redditName = req.query.redditName;
      User.findOne({ redditName: redditName }, function(e, user) {
        if(user) {
          res.json(user.serialize());
        } else {
          new User({ redditName: redditName }).save(function(e, user) {
            res.json(user.serialize());
          });
        }
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
