var mongoose = require('mongoose');

var env = process.env.NODE_ENV || 'development';

if(env === 'production') {
  mongoose.connect(process.env.MONGOHQ_URL);
} else {
  mongoose.connect('mongodb://localhost/cluster2' + env);
}

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));

module.exports = db;
