var nock = require('nock');
var fs = require('fs');


var mock = function(subUrl, response) {
  return nock('http://www.reddit.com')
    .get(subUrl)
    .reply(200, response || { data: { children: [] } });
}

mock.withFile = function(subUrl, file) {
  if(!mock.CACHE[file]) {
    mock.CACHE[file] = fs.readFileSync(file);
  };

  return mock(subUrl, mock.CACHE[file]);
};

mock.CACHE = {
}

module.exports = mock;

