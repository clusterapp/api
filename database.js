var mongoose = require('mongoose');

var env = process.env.NODE_ENV || 'development';

mongoose.connect('mongodb://localhost/cluster2' + env);

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));

module.exports = db;
