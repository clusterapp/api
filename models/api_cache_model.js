var mongoose = require('mongoose');
var moment = require('moment');

var db = require('../database');

var schema = require('./cache_schema');

var ApiCache = mongoose.model('ApiCache', schema)

module.exports = ApiCache;

