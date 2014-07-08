// all these routes are nested under /users

var express = require('express');

var userRoutes = {
  '/': {
    method: 'get',
    fn: function(req, res) {
      res.json({ foo: 'hello world' });
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
