var request = require('request');

exports._request = function(method, url, params, body, cb) {
  var paramArr = [];
  for(var key in params) {
    paramArr.push(key + '=' + params[key]);
  };

  request({
    method: method,
    url: url + '?' + paramArr.join('&'),
    body: body,
    headers: { 'Content-Type': 'application/json' }
  }, function(e, resp, body) {
    if(e) return cb(e);
    cb(null, JSON.parse(body));
  });
};

exports.get = function(url, params, cb) {
  exports._request('get', url, params, undefined, cb);
};

exports.post = function(url, params, body,  cb) {
  exports._request('post', url, params, body, cb);
};
