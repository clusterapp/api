var nock = require('nock');
var fs = require('fs');


var mock = function(subUrl, response) {
  return nock('http://www.reddit.com')
    .get(subUrl)
    .reply(200, response || { data: { children: [] } });
}

mock.withFile = function(subUrl, file) {
  return mock(subUrl, fs.readFileSync(file));
};

module.exports = mock;

