var request = require('request');

exports._request = function(method, url, params, cb) {
  var paramArr = [];
  for(var key in params) {
    paramArr.push(key + '=' + params[key]);
  };

  request[method](url + '?' + paramArr.join('&'), function(e, resp, body) {
    if(e) return cb(e);
    cb(null, JSON.parse(body));
  });
};

exports.get = function(url, params, cb) {
  exports._request('get', url, params, cb);
};

exports.post = function(url, params, cb) {
  exports._request('post', url, params, cb);
};
