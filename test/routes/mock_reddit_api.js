var nock = require('nock');

module.exports = function(subUrl, response) {
  return nock('http://www.reddit.com')
    .get(subUrl)
    .reply(200, response || {
      data: true
    });
}

