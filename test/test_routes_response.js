var expect = require('expect.js');

module.exports = function(routesObject) {
  return function(endpoint, data) {
    routesObject[endpoint].fn({}, {
      json: function(res) {
        expect(res).to.eql(data);
      }
    });
  };
};
