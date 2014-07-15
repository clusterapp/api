var mongoose = require('mongoose');
var moment = require('moment');

var db = require('../database');

var schema = require('./cache_schema');

var ListingCache = mongoose.model('ListingCache', schema)

module.exports = ListingCache;

