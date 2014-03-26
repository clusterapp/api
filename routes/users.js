// all these routes are nested under /users

var express = require('express');

var users = express.Router();

users.get('/', function(req, res) {
  res.json({ foo: 'hello world' });
});


module.exports = users;
